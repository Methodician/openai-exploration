import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { encoding_for_model } from '@dqbd/tiktoken';

import { Configuration, OpenAIApi } from 'openai';
import {
  ChatCompletionRequest,
  RequestMessage,
  ThreadConfig,
  ThreadMessage,
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
  };
  const metadata = {
    name: 'Unnamed Thread',
    messageCount: 1,
    tokenCount: 11,
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
      const threadRef = admin.database().ref(`/chat/${threadId}/thread`);
      const threadSnap = await threadRef.get();
      const thread = threadSnap.val();
      // add a final user message to the thread
      thread.messages.push({
        role: 'user',
        content:
          'Please come up with a creative and succinct description for this session. It can be a word, words, or a phrase. It must be between 5 and 21 characters, and should succinctly describe the purpose of the session. Respond only with the new name you invented and nothing else. ',
      });

      try {
        const aiResponse = await openai.createChatCompletion(thread);
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

    const sessionNameRef = admin.database().ref(`/chat/${threadId}/name`);
    return sessionNameRef.set(newName);
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
      const response = await openai.createChatCompletion(request);
      const responseData = response.data;
      const newMessage = responseData.choices[0].message;
      if (!newMessage) {
        throw new Error('No message returned from OpenAI');
      }

      return Promise.all([
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
      return null;
    }
  });

export const onMessageWrite = functions.database
  .ref('/threadMessages/{threadId}/{messageId}')
  .onWrite(async (change, context) => {
    // get the thread ID and messageId
    const { threadId } = context.params;
    const threadTokenCountRef = admin
      .database()
      .ref(`/threadMetadata/${threadId}/tokenCount`);
    const threadTokenCountSnap = await threadTokenCountRef.get();
    let threadTokenCount = threadTokenCountSnap.val() as number;
    // get the message data
    const oldMessage = change.before.val() as ThreadMessage;
    const newMessage = change.after.val() as ThreadMessage;

    // if there is an old and not a new, it was deleted, so just reduce the thread token count
    if (oldMessage && !newMessage) {
      threadTokenCount -= oldMessage.tokenCount;
      return threadTokenCountRef.set(threadTokenCount);
    }

    if (oldMessage && newMessage) {
      if (oldMessage.content === newMessage.content) {
        return;
      }
      // it was an edit, so we need to reduce the thread token count before adding the new one
      threadTokenCount -= oldMessage.tokenCount;
    }

    // I think from here we can assume there is a new message...

    // get only the content, role, and name from the message
    const { content, role, name } = newMessage;
    const newRequestMessage: RequestMessage = {
      content,
      role,
      name,
    };

    const encoding = encoding_for_model('gpt-4'); // should be dynamic
    const tokensPerMessage = 3; // gpt-4 & may change later
    const tokensPerName = 1; // gpt-4 & may change later
    let newTokenCount = tokensPerMessage;
    for (const [key, val] of Object.entries(newRequestMessage)) {
      if (val) {
        newTokenCount += encoding.encode(val).length;
      }
      if (key === 'name') {
        newTokenCount += tokensPerName;
      }
    }
    threadTokenCount += newTokenCount;

    return Promise.all([
      threadTokenCountRef.set(threadTokenCount),
      change.after.ref.update({ tokenCount: newTokenCount }),
    ]);
  });
