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
  private threadModelPath = (threadId: string) =>
    `${this.threadPath(threadId)}/config/model`;
  private threadPreferencesPath = (threadId: string) =>
    `${this.threadPath(threadId)}/preferences`;

  allThreads$ = () => {
    return listVal<any>(ref(this.db, 'threads'), { keyField: 'key' });
  };

  thread$ = (threadId: string) =>
    objectVal<any>(ref(this.db, this.threadPath(threadId)));

  threadMessages$ = (threadId: string) =>
    listVal<any>(ref(this.db, this.threadMessagesPath(threadId)), {
      keyField: 'key',
    });

  threadPreferences$ = (threadId: string) =>
    objectVal<any>(ref(this.db, this.threadPreferencesPath(threadId)));

  threadMetadata$ = (threadId: string) =>
    objectVal<any>(ref(this.db, this.threadMetadataPath(threadId)));

  createNewThread$ = () =>
    httpsCallableData<any>(this.functions, 'createNewChatThread')();

  setThreadModel = (threadId: string, model: string) =>
    set(ref(this.db, this.threadModelPath(threadId)), model);

  updateThreadPreferences = (threadId: string, preferences: any) =>
    update(ref(this.db, this.threadPreferencesPath(threadId)), preferences);

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
}
