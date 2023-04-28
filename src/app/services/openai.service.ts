import { Injectable, inject } from '@angular/core';
import {
  Database,
  ref,
  push,
  objectVal,
  set,
  listVal,
} from '@angular/fire/database';
import { serverTimestamp } from 'firebase/database';
import { ChatMessage, OpenaiModel } from '../models/shared';

@Injectable({
  providedIn: 'root',
})
export class OpenaiService {
  threadId = 'asdf1234'; // Will be dynamic and maybe elsewhere

  // This may be a dumb name for the service, since the server is what interacts with the OpenAI API
  private db: Database = inject(Database);

  constructor() {}

  sendCompletionPrompt = (
    prompt: string
    // model?: string,
    // maxTokens?: number,
    // temperature?: number,
    // topP?: number,
    // numberOfCompletions?: number,
    // stream = true, // whether to stream results back
    // presencePenalty = 0.0, // -2 to +2, Positive values penalize new tokens based on whether they appear in the text so far, increasing new topic focus
    // frequencyPenalty = 0.0, // -2 to +2, Positive values penalize new tokens based on their existing frequency in the text so far, decreasing repetition of lines
    // user?: string // user id
  ) => {
    const promptRef = push(ref(this.db, 'completions'), { prompt });
    const promptKey = promptRef.key;
    if (!promptKey) {
      throw new Error('Prompt key is null');
    }
    return promptKey;
  };

  completionResponse$ = (promptKey: string) => {
    const promptRef = ref(this.db, `completions/${promptKey}/response`);

    return objectVal(promptRef);
  };

  requestUpdatedModels = () => {
    const modelsRequestDateRef = ref(
      this.db,
      `availableModels/lastRequestDate`
    );

    return set(modelsRequestDateRef, serverTimestamp());
  };

  availableModels$ = () => {
    const availableModelsRef = ref(this.db, `availableModels/models`);

    return listVal<OpenaiModel>(availableModelsRef);
  };

  // setChatThreadSystemMessage = (threadId: string, message: string) => {
  //   const sysMessageRef = ref(this.db, `chat/${threadId}/systemMessage`);
  //   return set(sysMessageRef, { systemMessage: message });
  // };

  setChatThreadModel = (model: string) => {
    const threadModelRef = ref(this.db, `chat/${this.threadId}/model`);
    return set(threadModelRef, model);
  };

  sendChatPrompt = (prompt: string) => {
    const lastPromptRef = ref(this.db, `chat/${this.threadId}/lastUserPrompt`);
    return set(lastPromptRef, prompt);
  };

  chatThreadMessages$ = () => {
    const messagesRef = ref(this.db, `chat/${this.threadId}/messages`);
    return listVal<ChatMessage>(messagesRef);
  };
}
