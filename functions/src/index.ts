import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { Configuration, OpenAIApi } from 'openai';
import { ChatCompletionRequest } from './models/generated/shared';

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

export const updateAvailableModels = functions.database
  .ref('/availableModels/lastRequestDate')
  .onUpdate(async (_) => {
    const modelsResponse = await openai.listModels();
    const models = modelsResponse.data.data;

    const availableModelsRef = admin.database().ref('/availableModels/models');

    return availableModelsRef.set(models);
  });

// Might actually save these to Firestore instead of Realtime Database, but maybe just for long-term?
// I think in a prod app each user might have a single active thread in rtdb, and then a history of threads in firestore
export const createNewChatThread = functions.https.onCall(async () => {
  // Here I would probably track the user's ID and create a new thread for them
  const request: ChatCompletionRequest = {
    model: env.openaiModel,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.',
      },
    ],
  };
  const sessionRef = admin
    .database()
    .ref('/chat')
    .push({ thread: request, name: 'Unnamed Thread' });
  return sessionRef.key;
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
  .runWith({ timeoutSeconds: 360 })
  .https.onCall(async (data, context) => {
    const { threadId } = data;
    if (!threadId) {
      throw new Error('No thread id');
    }

    const threadRef = admin.database().ref(`/chat/${threadId}/thread`);
    const threadSnap = await threadRef.get();
    const thread = threadSnap.val();

    try {
      const response = await openai.createChatCompletion(thread);
      const responseData = response.data;
      const newMessage = responseData.choices[0].message;
      if (!newMessage) {
        throw new Error('No message returned from OpenAI');
      }

      thread.messages.push(newMessage);
      const messagesRef = threadRef.child('messages');
      const lastResponseRef = threadRef.parent!.child('lastApiResponse');

      return Promise.all([
        lastResponseRef.set(responseData),
        messagesRef.set(thread.messages),
      ]);
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
  });
