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
import {
  ChatCompletionRequest,
  ChatMessage,
  OpenaiModel,
} from '../models/shared';
import {
  Functions,
  httpsCallable,
  httpsCallableData,
} from '@angular/fire/functions';

@Injectable({
  providedIn: 'root',
})
export class OpenaiService {
  // This may be a dumb name for the service, since the server is what interacts with the OpenAI API
  private db: Database = inject(Database);
  private functions = inject(Functions);

  constructor() {}

  private chatPath = (threadId: string) => `chat/${threadId}`;
  private threadPath = (threadId: string) =>
    `${this.chatPath(threadId)}/thread`;
  private messagesPath = (threadId: string) =>
    `${this.threadPath(threadId)}/messages`;
  private threadModelPath = (threadId: string) =>
    `${this.threadPath(threadId)}/model`;

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

  availableThreads$ = () => {
    const threadsRef = ref(this.db, `chat`);

    return listVal<any>(threadsRef, { keyField: 'key' });
  };

  createNewThread$ = () =>
    httpsCallableData<any>(this.functions, 'createNewChatThread')();

  setChatThreadModel = (model: string, threadId: string) => {
    const threadModelRef = ref(this.db, this.threadModelPath(threadId));
    return set(threadModelRef, model);
  };

  submitChatThreadToAi = (threadId: string) =>
    httpsCallable(this.functions, 'submitChatThread')({ threadId });

  updateChatThreadMessages = (messages: ChatMessage[], threadId: string) => {
    const messagesRef = ref(this.db, this.messagesPath(threadId));
    return set(messagesRef, messages);
  };

  renameChatThread = (threadId: string, name: string | null) =>
    httpsCallable(this.functions, 'renameChatThread')({ threadId, name });

  chatThread$ = (threadId: string) => {
    const threadRef = ref(this.db, this.threadPath(threadId));
    return objectVal<ChatCompletionRequest>(threadRef);
  };

  chatThreadMessages$ = (threadId: string) => {
    const messagesRef = ref(this.db, this.messagesPath(threadId));
    return listVal<ChatMessage>(messagesRef);
  };

  chatThreadName$ = (threadId: string) => {
    const chatNameRef = ref(this.db, `${this.chatPath(threadId)}/name`);
    return objectVal<string>(chatNameRef);
  };
}
