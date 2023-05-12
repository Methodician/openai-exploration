import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import {
  ThreadConfig,
  ThreadMessage,
  ThreadPrefs,
} from 'src/app/models/shared';
import { HeaderService } from 'src/app/services/header.service';
import { ThreadService } from 'src/app/services/thread.service';
import { MatDialog } from '@angular/material/dialog';
import { ThreadPreferencesDialogComponent } from '../dialogs/thread-preferences-dialog/thread-preferences-dialog.component';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})
export class ThreadComponent implements OnInit {
  @ViewChild('messageHistory', { read: ElementRef })
  private messageHistory?: ElementRef;
  preferences: any = {};
  model = 'gpt-4';
  promptText = '';
  threadId?: string;
  messages$ = new Subject<any>();
  metadata$ = new Subject<any>();

  constructor(
    private headerService: HeaderService,
    private threadService: ThreadService,
    private activeRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      const threadId = params['threadId'];
      if (threadId) {
        this.threadId = threadId;

        this.threadService.threadMetadata$(threadId).subscribe((metadata) => {
          if (metadata) {
            this.metadata$.next(metadata);
            this.headerService.setHeaderText(metadata.name);
          }
        });

        this.threadService.threadMessages$(threadId).subscribe((messages) => {
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
          .subscribe((preferences) => {
            if (preferences) {
              this.preferences = preferences;
            }
          });
      }
    });

    this.headerService.otherStuffClicked$.subscribe(() => {
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
        .subscribe((result: { config: ThreadConfig; prefs: ThreadPrefs }) => {
          this.saveConfig(result.config, result.prefs);
        });
    });
  }

  saveConfig = (config: ThreadConfig, prefs: ThreadPrefs) => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    this.threadService.updateThreadConfig(this.threadId, config);
    this.threadService.updateThreadPrefs(this.threadId, prefs);
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

  renameThread = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    const name = prompt('Enter a new thread name, or nothing to auto generate');

    this.threadService.renameThread(this.threadId, name);
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
