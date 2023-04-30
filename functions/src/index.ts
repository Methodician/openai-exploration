import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { Configuration, OpenAIApi } from 'openai';
import { ChatMessage } from './models/generated/shared';

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

// May adapt this to encapsulate a thread with some configs from the DB such as model, max tokens, etc.
export const respondToCompletionsPrompt = functions.database
  .ref('/completions/{promptId}/prompt')
  .onCreate(async (snapshot, _) => {
    const prompt = snapshot.val();
    if (typeof prompt !== 'string') {
      throw new Error('Prompt is not a string');
    }

    const response = await openai.createCompletion({
      model: env.openaiModel,
      prompt,
      max_tokens: env.maxTokens,
      temperature: env.temperature,
    });

    const completion = response.data;

    return snapshot.ref.parent!.child('response').set(completion);
  });

export const respondToChatPrompt = functions
  .runWith({ timeoutSeconds: 360 })
  .database.ref('/chat/{threadId}/lastUserPrompt')
  .onWrite(async (snapshot, context) => {
    const prompt = snapshot.after.val();
    if (typeof prompt !== 'string') {
      throw new Error('Prompt is not a string');
    }

    const threadId = context.params.threadId;

    const threadRef = admin.database().ref(`/chat/${threadId}`);
    const thread = await threadRef.get();
    const model = thread.val().model || env.openaiModel;
    let messages = thread.val().messages as ChatMessage[];
    if (!messages) {
      messages = [];
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    try {
      const response = await openai.createChatCompletion({
        model,
        messages,
        // max_tokens: env.maxTokens,
        // temperature: env.temperature,
      });

      const newMessage = response.data.choices[0].message;

      if (newMessage) {
        messages.push(newMessage);
      }

      const lastResponseRef = threadRef.child('lastResponse');
      const messagesRef = threadRef.child('messages');

      // return lastResponseRef.set(newMessage);

      return Promise.all([
        lastResponseRef.set(newMessage),
        messagesRef.set(messages),
      ]);

      // const completion = response.data;

      // return snapshot.ref.parent!.child('completion').set(completion);
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
