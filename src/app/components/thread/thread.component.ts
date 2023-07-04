import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  ThreadConfig,
  ThreadMessage,
  ThreadMetadata,
  ThreadPrefs,
} from 'src/app/models/shared';
import { HeaderService } from 'src/app/services/header.service';
import { ThreadService } from 'src/app/services/thread.service';
import { MatDialog } from '@angular/material/dialog';
import { ThreadPreferencesDialogComponent } from '../dialogs/thread-preferences-dialog/thread-preferences-dialog.component';
import { FooterService } from 'src/app/services/footer.service';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})
export class ThreadComponent implements OnInit {
  private unsubscribe$ = new Subject<void>();
  @ViewChild('messageHistory', { read: ElementRef })
  private messageHistory?: ElementRef;
  preferences: ThreadPrefs = {
    shouldAutoSubmit: false,
    shouldSendOnEnter: false,
  };
  model = 'gpt-4';
  promptText = '';
  threadId?: string;
  messages$ = new Subject<ThreadMessage[]>();
  metadata$ = new Subject<ThreadMetadata>();
  threadMaxTokens$ = new Subject<number>();

  constructor(
    private footerService: FooterService,
    private headerService: HeaderService,
    private threadService: ThreadService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.footerService.setFooter('THREAD');
    this.headerService.isTitleClickable$.next(true);
    this.headerService.isThereOtherStuff$.next(true);
    this.activeRoute.params
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        const threadId = params['threadId'];
        if (threadId) {
          this.threadId = threadId;

          let lastLoadingState = false;
          this.threadService
            .threadMetadata$(threadId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((metadata) => {
              if (metadata) {
                if (lastLoadingState !== metadata.isAiGenerating) {
                  setTimeout(() => {
                    // pushes down the call stack so the element has a chance to exist
                    if (this.messageHistory?.nativeElement) {
                      this.scrollToBottom();
                    }
                  });
                  lastLoadingState = metadata.isAiGenerating;
                }
                this.metadata$.next(metadata);
                this.headerService.setHeaderText(metadata.name);
              }
            });

          this.threadService
            .threadMaxTokens$(threadId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((maxTokens) => {
              if (maxTokens) {
                this.threadMaxTokens$.next(maxTokens);
              }
            });

          this.threadService
            .threadMessages$(threadId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((messages) => {
              if (messages) {
                this.messages$.next(messages);
                setTimeout(() => {
                  // pushes down the call stack so the element has a chance to exist
                  if (this.messageHistory?.nativeElement) {
                    this.scrollToBottom();
                  }
                });
              }
            });

          this.threadService
            .threadPreferences$(threadId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((preferences) => {
              if (preferences) {
                this.preferences = preferences;
              }
            });
        }
      });

    this.headerService.otherStuffClicked$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.openThreadPrefsDialog();
      });

    this.headerService.titleClicked$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.renameThread();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.footerService.setFooter('NONE');
    this.headerService.isTitleClickable$.next(false);
    this.headerService.setHeaderText('AI Power User');
    this.headerService.isThereOtherStuff$.next(false);
  }

  openThreadPrefsDialog = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    const dialogRef = this.dialog.open(ThreadPreferencesDialogComponent, {
      data: { threadId: this.threadId },
      width: '700px',
      panelClass: 'settings-dialog',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (result?: {
          config: ThreadConfig;
          prefs: ThreadPrefs;
          shouldDelete: boolean;
        }) => {
          if (!result) {
            return;
          }
          if (result.shouldDelete) {
            this.deleteThread();
            return;
          } else {
            this.saveConfig(result.config, result.prefs);
          }
        }
      );
  };

  renameThread = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    const name = prompt('Enter a new thread name, or nothing to auto generate');
    if (name !== null) {
      this.threadService.renameThread(this.threadId, name);
    }
  };

  saveConfig = (config: ThreadConfig, prefs: ThreadPrefs) => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    this.threadService.updateThreadConfig(this.threadId, config);
    this.threadService.updateThreadPrefs(this.threadId, prefs);
  };

  deleteThread = async () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    await this.threadService.deleteThread(this.threadId);
    this.router.navigate(['/']);
  };

  scrollToBottom = () => {
    if (!!this.messageHistory) {
      this.messageHistory.nativeElement.scrollTop =
        this.messageHistory.nativeElement.scrollHeight;
    }
  };

  sendMessage = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    this.threadService.sendUserMessage(this.threadId, this.promptText);
    this.promptText = '';

    if (this.preferences.shouldAutoSubmit) {
      this.submitThread();
    }
  };

  submitThread = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    this.threadService.submitThreadToAi(this.threadId);
  };

  onEnterKeyDown = (e: Event): void => {
    if (this.preferences.shouldSendOnEnter) {
      e.preventDefault();
      this.sendMessage();
    }
  };

  updateMessage = ($event: { key: string; newContent: string }) => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    const { key, newContent } = $event;
    this.threadService.updateThreadMessage(this.threadId, key, newContent);
  };

  deleteMessage = (messageKey: string) => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    this.threadService.deleteThreadMessage(this.threadId, messageKey);
  };

  // helpers
  trackMessagesByContent = (_: number, message: ThreadMessage) =>
    message.content;
}
