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
import {
  BehaviorSubject,
  Subject,
  Subscription,
  filter,
  firstValueFrom,
  map,
  of,
  switchMap,
  take,
} from 'rxjs';

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
  threadId$ = this.currentParamMap$.pipe(
    map((paramMap) => paramMap?.get('threadId'))
  );
  threadIdForSure$ = this.threadId$.pipe(
    map((threadId) => {
      if (!threadId) {
        throw new Error(
          'Cannot perform this action because threadId is missing'
        );
      }
      return threadId;
    })
  );

  threadDataList$ = <T>(
    pathFn: (threadId: string) => string,
    shouldProvideKey = false
  ) =>
    this.threadId$.pipe(
      switchMap((threadId) => {
        if (!threadId) {
          return of(null);
        }
        return listVal<T>(
          ref(this.db, pathFn(threadId)),
          shouldProvideKey
            ? {
                keyField: 'key',
              }
            : undefined
        );
      })
    );
  threadDataObject$ = <T>(pathFn: (threadId: string) => string) =>
    this.threadId$.pipe(
      switchMap((threadId) => {
        if (!threadId) {
          return of(null);
        }
        return objectVal<T>(ref(this.db, pathFn(threadId)));
      })
    );

  threadMetadata$ = this.threadDataObject$<ThreadMetadata>(
    this.threadMetadataPath
  );
  threadMessages$ = this.threadDataList$<ThreadMessage>(
    this.threadMessagesPath,
    true
  );

  threadConfig$ = this.threadDataObject$<ThreadConfig>(this.threadConfigPath);
  threadPreferences$ = this.threadDataObject$<ThreadPrefs>(
    this.threadPreferencesPath
  );
  lastThreadError$ = this.threadDataObject$<string>(this.lastThreadErrorPath);

  constructor(
    private httpClient: HttpClient,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.threadId$.subscribe((threadId) => {
      console.log('threadId', threadId);
    });
    this.threadIdForSure$.subscribe((threadId) => {
      console.log('threadIdForSure', threadId);
    });
    this.watchRouterNavigationEnd();
    this.threadId$.subscribe((threadId) => {
      console.log('threadId', threadId);
    });
    this.threadMetadata$.subscribe((metadata) => {
      console.log('metadata', metadata);
    });
    this.threadConfig$.subscribe((config) => {
      console.log('config', config);
    });
    this.threadPreferences$.subscribe((prefs) => {
      console.log('prefs', prefs);
    });
    setTimeout(() => {
      // For some reason this has to be pushed down callstack
      // in order for components to get the initial value upon load
      this.currentParamMap$.next(this.getRouteParamMap());
    }, 0);
  }

  watchRouterNavigationEnd = () => {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentParamMap$.next(this.getRouteParamMap());
      });
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

  createNewThread$ = () =>
    httpsCallableData<any>(this.functions, 'createNewChatThread')();

  updateThreadConfig = (config: ThreadConfig) =>
    firstValueFrom(this.threadIdForSure$).then((threadId) => {
      update(ref(this.db, this.threadConfigPath(threadId)), config);
    });

  updateThreadPrefs = (prefs: ThreadPrefs) =>
    firstValueFrom(this.threadIdForSure$).then((threadId) => {
      update(ref(this.db, this.threadPreferencesPath(threadId)), prefs);
    });

  sendUserMessage = (content: string) =>
    firstValueFrom(this.threadIdForSure$).then((threadId) => {
      const messageRef = ref(this.db, this.threadMessagesPath(threadId));
      return push(messageRef, { role: 'user', content });
    });

  updateThreadMessage = (messageKey: string, message: string) =>
    firstValueFrom(this.threadIdForSure$).then((threadId) =>
      update(ref(this.db, this.threadMessagePath(threadId, messageKey)), {
        content: message,
      })
    );

  deleteThreadMessage = (messageKey: string) =>
    firstValueFrom(this.threadIdForSure$).then((threadId) => {
      // used to use set(null) but trying this way
      remove(ref(this.db, this.threadMessagePath(threadId, messageKey)));
    });

  renameThread = (name: string | null) =>
    firstValueFrom(this.threadIdForSure$).then((threadId) => {
      httpsCallable(this.functions, 'renameChatThread')({ threadId, name });
    });

  submitThreadToAi = () =>
    firstValueFrom(this.threadIdForSure$).then((threadId) =>
      httpsCallable(this.functions, 'submitChatThread')({ threadId })
    );

  deleteThread = (threadId: string) =>
    remove(ref(this.db, this.threadPath(threadId)));

  availableModels$ = () =>
    this.httpClient.get<OpenaiModel[]>(
      'https://us-central1-openai-exploration-9d32c.cloudfunctions.net/getAvailableModels'
    );
}
