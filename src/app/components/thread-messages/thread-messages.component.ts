import { Component, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ThreadMessage, ThreadMetadata } from 'src/app/models/shared';
import { RouterService } from 'src/app/services/router.service';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-thread-messages',
  templateUrl: './thread-messages.component.html',
  styleUrls: ['./thread-messages.component.scss'],
})
export class ThreadMessagesComponent {
  private unsubscribe$ = new Subject<void>();
  private threadService = inject(ThreadService);
  private routerService = inject(RouterService);
  messages: ThreadMessage[] = [];
  metadata?: ThreadMetadata;

  ngOnInit(): void {
    let lastLoadingState = false;
    let lastMessageCount = 0;
    this.threadService.currentThreadMessages$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((messages) => {
        if (!messages) {
          this.messages = [];
        } else {
          this.messages = messages;
          if (lastMessageCount !== messages.length) {
            setTimeout(() => {
              // pushes down the call stack so the element has a chance to exist
              this.routerService.scrollToBottom();
            });
            lastMessageCount = messages.length;
          }
        }
      });
    this.threadService.currentThreadMetadata$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((metadata) => {
        if (!metadata) {
          this.metadata = undefined;
        } else {
          this.metadata = metadata;
          if (lastLoadingState !== metadata.isAiGenerating) {
            setTimeout(() => {
              // pushes down the call stack so the element has a chance to exist
              this.routerService.scrollToBottom();
            });
            lastLoadingState = metadata.isAiGenerating;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  updateMessage = ($event: { key: string; newContent: string }) => {
    const { key, newContent } = $event;
    this.threadService.updateCurrentThreadMessage(key, newContent);
  };

  deleteMessage = (messageId: string) => {
    this.threadService.deleteCurrentThreadMessage(messageId);
  };

  // helpers
  trackMessagesByContent = (_: number, message: ThreadMessage) =>
    message.content;
}
