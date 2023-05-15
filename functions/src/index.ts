import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { encoding_for_model } from '@dqbd/tiktoken';

import { Configuration, OpenAIApi } from 'openai';
import {
  ChatCompletionRequest,
  RequestMessage,
  ThreadConfig,
  ThreadMessage,
  ThreadMetadata,
} from './models/generated/shared';

admin.initializeApp();

const env = {
  openaiOrg: process.env.OPENAI_ORG,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'text-davinci-003',
  maxTokens: +(process.env.MAX_TOKENS || '100'),
  temperature: +(process.env.TEMPERATURE || '0.5'),
};

const openaiConfig = new Configuration({
  organization: env.openaiOrg,
  apiKey: env.openaiApiKey,
});

const openai = new OpenAIApi(openaiConfig);

export const getAvailableModels = functions.https.onCall(async () => {
  const modelsResponse = await openai.listModels();
  const models = modelsResponse.data.data;

  return models;
});

// Might actually save these to Firestore instead of Realtime Database, but maybe just for long-term?
// I think in a prod app each user might have a single active thread in rtdb, and then a history of threads in firestore
export const createNewChatThread = functions.https.onCall(async () => {
  // Here I would probably track the user's ID and create a new thread for them
  const model = env.openaiModel;
  const config: ThreadConfig = {
    model,
    max_tokens: env.maxTokens || 3000,
    temperature: 1,
    top_p: 1,
    n: 1,
    presence_penalty: 0.0,
    frequency_penalty: 0.0,
  };
  const metadata: ThreadMetadata = {
    name: 'Unnamed Thread',
    messageCount: 0,
    tokenCount: 0,
    isAiGenerating: false,
  };
  const preferences = {
    shouldSendOnEnter: true,
    shouldAutoSubmit: false,
  };
  const systemMessage = {
    role: 'system',
    content: 'You are a helpful AI assistant.',
    tokenCount: 11,
  };

  const threadRef = admin.database().ref('/threads').push({
    config,
    preferences,
  });

  const key = threadRef.key;
  const threadMessagesRef = admin.database().ref(`/threadMessages/${key}`);
  const threadMetadataRef = admin.database().ref(`/threadMetadata/${key}`);

  await Promise.all([
    threadMetadataRef.set(metadata),
    threadMessagesRef.push(systemMessage),
  ]);

  return threadRef.key;
});

export const renameChatThread = functions.https.onCall(
  async (data, context) => {
    const { threadId, name } = data as { threadId: string; name?: string };
    let newName = name || '';
    if (!threadId) {
      throw new Error('No thread id');
    }
    if (!name) {
      const messagesRef = admin.database().ref(`/threadMessages/${threadId}`);
      const threadRef = admin.database().ref(`/threads/${threadId}`);
      const messagesSnap = await messagesRef.get();
      const threadSnap = await threadRef.get();
      const messages = Object.values(messagesSnap.val()).map(
        ({ content, role }: any) => ({
          content,
          role,
        })
      );
      const thread = threadSnap.val();

      messages.push({
        role: 'user',
        content:
          'Respond now with a creative and succinct description for this session. It can be a word, multiple words, or a phrase. It must be between 5 and 40 characters, and should succinctly describe the purpose of the session. Respond only with the new name and nothing else.',
      });

      const request: ChatCompletionRequest = {
        messages: messages as RequestMessage[],
        ...thread.config,
      };

      try {
        const aiResponse = await openai.createChatCompletion(request);
        const responseData = aiResponse.data;
        const newMessageContent = responseData.choices[0].message?.content;
        if (!newMessageContent) {
          throw new Error('No message returned from OpenAI');
        }
        newName = newMessageContent;
      } catch (error: any) {
        if (error.response) {
          console.error('error status and error data:');
          console.log(error.response.status);
          console.log(error.response.data);
        } else {
          console.error('error message:');
          console.log(error.message);
        }
        return null;
      }
    }

    const threadMetadataRef = admin
      .database()
      .ref(`/threadMetadata/${threadId}`);

    return threadMetadataRef.update({
      name: newName,
    });
  }
);

export const submitChatThread = functions
  .runWith({ timeoutSeconds: 540 })
  .https.onCall(async (data, context) => {
    const { threadId } = data;
    if (!threadId) {
      throw new Error('No thread id');
    }

    const configRef = admin.database().ref(`/threads/${threadId}/config`);
    const isGeneratingRef = admin
      .database()
      .ref(`/threadMetadata/${threadId}/isAiGenerating`);
    const messagesRef = admin.database().ref(`/threadMessages/${threadId}`);
    const lastSuccessRef = admin
      .database()
      .ref(`/threads/${threadId}/lastSuccessResponse`);
    const lastErrorRef = admin
      .database()
      .ref(`/threads/${threadId}/lastErrorResponse`);
    const [configSnap, messagesSnap] = await Promise.all([
      configRef.get(),
      messagesRef.get(),
    ]);
    const config = configSnap.val() as ThreadConfig;
    const messages = Object.values<ThreadMessage>(
      messagesSnap.val()
    ).map<RequestMessage>(({ content, role }) => ({
      content,
      role,
    }));

    const request: ChatCompletionRequest = {
      messages,
      ...config,
    };

    try {
      isGeneratingRef.set(true);
      const response = await openai.createChatCompletion(request);
      const responseData = response.data;
      const newMessage = responseData.choices[0].message;
      if (!newMessage) {
        throw new Error('No message returned from OpenAI');
      }

      await Promise.all([
        messagesRef.push(newMessage),
        lastSuccessRef.set(responseData),
      ]);
    } catch (error: any) {
      lastErrorRef.set(error);
      if (error.response) {
        console.error('error status and error data:');
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.error('error message:');
        console.log(error.message);
      }
    }
    return isGeneratingRef.set(false);
  });

const countMessageTokens = (message: RequestMessage | ThreadMessage) => {
  const encoding = encoding_for_model('gpt-4'); // should be dynamic
  const tokensPerMessage = 3; // gpt-4 & may change later
  const tokensPerName = 1; // gpt-4 & may change later
  let newTokenCount = tokensPerMessage;
  for (const [key, val] of Object.entries(message)) {
    if (key === 'tokenCount') continue;
    if (val && typeof val === 'string') {
      newTokenCount += encoding.encode(val).length;
    }
    if (key === 'name') {
      newTokenCount += tokensPerName;
    }
  }
  return newTokenCount;
};

export const onMessageCreate = functions.database
  .ref('/threadMessages/{threadId}/{messageId}')
  .onCreate(async (snapshot, context) => {
    const { threadId } = context.params;
    const message = snapshot.val() as ThreadMessage;
    const newTokenCount = countMessageTokens(message);
    const threadMessageCountRef = admin
      .database()
      .ref(`/threadMetadata/${threadId}/messageCount`);
    const threadTokenCountRef = admin
      .database()
      .ref(`/threadMetadata/${threadId}/tokenCount`);

    return Promise.all([
      snapshot.ref.child('tokenCount').set(newTokenCount),
      threadTokenCountRef.transaction(
        (currentTokenCount) => currentTokenCount + newTokenCount
      ),
      threadMessageCountRef.transaction(
        (currentMessageCount) => currentMessageCount + 1
      ),
    ]);
  });

export const onMessageUpdate = functions.database
  .ref('/threadMessages/{threadId}/{messageId}')
  .onUpdate(async (change, context) => {
    const { threadId } = context.params;
    const newMessage = change.after.val() as ThreadMessage;
    const oldMessage = change.before.val() as ThreadMessage;
    if (newMessage.content === oldMessage.content) return null;
    const newTokenCount = countMessageTokens(newMessage);
    const oldTokenCount = oldMessage.tokenCount || 0;
    const messageTokensRef = change.after.ref.child('tokenCount');
    const threadTokenCountRef = admin
      .database()
      .ref(`/threadMetadata/${threadId}/tokenCount`);

    return Promise.all([
      messageTokensRef.set(newTokenCount),
      threadTokenCountRef.transaction(
        (currentTokenCount) => currentTokenCount - oldTokenCount + newTokenCount
      ),
    ]);
  });

export const onMessageDelete = functions.database
  .ref('/threadMessages/{threadId}/{messageId}')
  .onDelete(async (snapshot, context) => {
    const { threadId } = context.params;
    const message = snapshot.val() as ThreadMessage;
    const messageTokenCount = message.tokenCount || 0;
    const threadTokenCountRef = admin
      .database()
      .ref(`/threadMetadata/${threadId}/tokenCount`);
    const threadMessageCountRef = admin
      .database()
      .ref(`/threadMetadata/${threadId}/messageCount`);
    const threadTokenSnap = await threadTokenCountRef.get();
    const threadTokenCount = threadTokenSnap.val() as number;
    if (!threadTokenCount) {
      return;
    }

    return Promise.all([
      threadTokenCountRef.transaction(
        (currentTokenCount) => currentTokenCount - messageTokenCount
      ),
      threadMessageCountRef.transaction(
        (currentMessageCount) => currentMessageCount - 1
      ),
    ]);
  });

export const onThreadDelete = functions.database
  .ref('/threads/{threadId}')
  .onDelete(async (snapshot, context) => {
    const { threadId } = context.params;
    const threadMetadataRef = admin
      .database()
      .ref(`/threadMetadata/${threadId}`);
    const threadMessagesRef = admin
      .database()
      .ref(`/threadMessages/${threadId}`);

    return Promise.all([
      threadMetadataRef.remove(),
      threadMessagesRef.remove(),
    ]);
  });
