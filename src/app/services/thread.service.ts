import { Injectable, inject } from '@angular/core';
import {
  Database,
  listVal,
  objectVal,
  push,
  ref,
  remove,
  set,
  update,
} from '@angular/fire/database';
import {
  Functions,
  httpsCallable,
  httpsCallableData,
} from '@angular/fire/functions';
import {
  OpenaiModel,
  ThreadConfig,
  ThreadMessage,
  ThreadMetadata,
  ThreadPrefs,
} from '../models/shared';
import { HttpClient } from '@angular/common/http';
import {
  ActivatedRoute,
  NavigationEnd,
  ParamMap,
  Router,
} from '@angular/router';
import { BehaviorSubject, filter, firstValueFrom, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private db: Database = inject(Database);
  private functions = inject(Functions);
  // ToDo: make these shared with functions folder
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
  private lastThreadErrorPath = (threadId: string) =>
    `${this.threadPath(threadId)}/lastError`;

  currentParamMap$ = new BehaviorSubject<ParamMap | null>(null);
  currentThreadId$ = this.currentParamMap$.pipe(
    map((paramMap) => paramMap?.get('threadId'))
  );
  threadIdForSure$ = this.currentThreadId$.pipe(
    map((id) => {
      if (!id) {
        throw new Error('currentThreadId is missing');
      }
      return id;
    })
  );

  currentThreadPreferences$ = this.currentThreadId$.pipe(
    filter((id) => !!id),
    switchMap((id) => this.threadPreferences$(id!))
  );
  currentThreadMetadata$ = this.currentThreadId$.pipe(
    filter((id) => !!id),
    switchMap((id) => this.threadMetadata$(id!))
  );
  currentThreadConfig$ = this.currentThreadId$.pipe(
    filter((id) => !!id),
    switchMap((id) => this.threadConfig$(id!))
  );

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.currentThreadId$.subscribe(console.log);
    this.watchRouterNavigationEnd();
    setTimeout(() => {
      // For some reason this has to be pushed down callstack
      // in order for components to get the initial value upon load
      this.currentParamMap$.next(this.getRouteParamMap());
    }, 0);
  }

  watchRouterNavigationEnd = () => {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.currentParamMap$.next(this.getRouteParamMap()));
  };

  getRouteParamMap = () => {
    let currentRoute = this.activatedRoute;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    return currentRoute.snapshot.paramMap;
  };

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

  lastThreadError$ = (threadId: string) =>
    objectVal<string>(ref(this.db, this.lastThreadErrorPath(threadId)));

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

  sendUserMessageX = async (content: string) => {
    const threadId = await firstValueFrom(this.threadIdForSure$);
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

  submitCurrentThread = async () => {
    const threadId = await firstValueFrom(this.threadIdForSure$);
    return this.submitThreadToAi(threadId);
  };

  deleteThread = (threadId: string) =>
    remove(ref(this.db, this.threadPath(threadId)));

  availableModels$ = () =>
    this.httpClient.get<OpenaiModel[]>(
      'https://us-central1-openai-exploration-9d32c.cloudfunctions.net/getAvailableModels'
    );
}
