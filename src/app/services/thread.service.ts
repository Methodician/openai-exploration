import { Injectable, inject } from '@angular/core';
import {
  Database,
  listVal,
  objectVal,
  push,
  ref,
  set,
  update,
} from '@angular/fire/database';
import {
  Functions,
  httpsCallable,
  httpsCallableData,
} from '@angular/fire/functions';
import {
  ThreadConfig,
  ThreadMessage,
  ThreadMetadata,
  ThreadPrefs,
} from '../models/shared';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private db: Database = inject(Database);
  private functions = inject(Functions);

  constructor() {}

  private threadMetadataPath = (threadId: string) =>
    `threadMetadata/${threadId}`;
  private threadMessagesPath = (threadId: string) =>
    `threadMessages/${threadId}`;
  private threadMessagePath = (threadId: string, messageId: string) =>
    `${this.threadMessagesPath(threadId)}/${messageId}`;
  private threadPath = (threadId: string) => `threads/${threadId}`;
  private threadConfigPath = (threadId: string) =>
    `${this.threadPath(threadId)}/config`;
  private threadPreferencesPath = (threadId: string) =>
    `${this.threadPath(threadId)}/preferences`;

  allThreads$ = () => {
    return listVal<ThreadMetadata>(ref(this.db, 'threadMetadata'), {
      keyField: 'key',
    });
  };

  thread$ = (threadId: string) =>
    objectVal<{
      config: ThreadConfig;
      preferences: ThreadPrefs;
      lastSuccessResponse: any;
    }>(ref(this.db, this.threadPath(threadId)));

  threadMessages$ = (threadId: string) =>
    listVal<ThreadMessage>(ref(this.db, this.threadMessagesPath(threadId)), {
      keyField: 'key',
    });

  threadPreferences$ = (threadId: string) =>
    objectVal<ThreadPrefs>(ref(this.db, this.threadPreferencesPath(threadId)));

  threadConfig$ = (threadId: string) =>
    objectVal<ThreadConfig>(ref(this.db, this.threadConfigPath(threadId)));

  threadMaxTokens$ = (threadId: string) =>
    objectVal<number>(
      ref(this.db, `${this.threadConfigPath(threadId)}/max_tokens`)
    );

  threadMetadata$ = (threadId: string) =>
    objectVal<any>(ref(this.db, this.threadMetadataPath(threadId)));

  createNewThread$ = () =>
    httpsCallableData<any>(this.functions, 'createNewChatThread')();

  updateThreadConfig = (threadId: string, config: ThreadConfig) =>
    update(ref(this.db, this.threadConfigPath(threadId)), config);

  updateThreadPrefs = (threadId: string, prefs: ThreadPrefs) =>
    update(ref(this.db, this.threadPreferencesPath(threadId)), prefs);

  sendUserMessage = (threadId: string, content: string) => {
    const messageRef = ref(this.db, this.threadMessagesPath(threadId));
    return push(messageRef, { role: 'user', content });
  };

  updateThreadMessage = (
    threadId: string,
    messageId: string,
    message: string
  ) =>
    update(ref(this.db, this.threadMessagePath(threadId, messageId)), {
      content: message,
    });

  deleteThreadMessage = (threadId: string, messageId: string) =>
    set(ref(this.db, this.threadMessagePath(threadId, messageId)), null);

  renameThread = (threadId: string, name: string | null) =>
    httpsCallable(this.functions, 'renameChatThread')({ threadId, name });

  submitThreadToAi = (threadId: string) =>
    httpsCallable(this.functions, 'submitChatThread')({ threadId });

  getAvailableModels = async () => {
    const getModels = httpsCallable(this.functions, 'getAvailableModels');
    const result = await getModels();
    return result.data;
  };
}