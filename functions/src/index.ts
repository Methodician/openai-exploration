import * as functions from 'firebase-functions';

import { Configuration, OpenAIApi } from 'openai';

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

// May adapt this to encapsulate a thread with some configs from the DB such as model, max tokens, etc.
export const respondToNewPrompt = functions.database
  .ref('/prompts/{promptId}/input')
  .onCreate(async (snapshot, context) => {
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

    return snapshot.ref.parent!.child('completion').set(completion);
  });
