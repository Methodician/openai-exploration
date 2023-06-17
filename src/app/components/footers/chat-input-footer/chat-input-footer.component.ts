import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ThreadMetadata, ThreadPrefs } from 'src/app/models/shared';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-chat-input-footer',
  templateUrl: './chat-input-footer.component.html',
  styleUrls: ['./chat-input-footer.component.scss'],
})
export class ChatInputFooterComponent {
  private unsubscribe$ = new Subject<void>();
  private threadService = inject(ThreadService);
  private activatedRoute = inject(ActivatedRoute);
  metadata$ = new Subject<ThreadMetadata>();
  threadMaxTokens$ = new Subject<number>();
  threadId?: string;
  promptText = '';
  preferences: ThreadPrefs = {
    shouldAutoSubmit: false,
    shouldSendOnEnter: false,
  };

  ngOnInit(): void {
    this.activatedRoute.params
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((params) => {
        const threadId = params['threadId'];
        this.threadId = threadId;
        if (threadId) {
          // this.threadService
          //   .threadMetadata$(threadId)
          //   .pipe(takeUntil(this.unsubscribe$))
          //   .subscribe((metadata) => {
          //     if (metadata) {
          //       this.metadata$.next(metadata);
          //     }
          //   });
        }

        // this.threadService
        //   .threadMaxTokens$(threadId)
        //   .pipe(takeUntil(this.unsubscribe$))
        //   .subscribe((maxTokens) => {
        //     if (maxTokens) {
        //       this.threadMaxTokens$.next(maxTokens);
        //     }
        //   });
      });
  }

  sendMessage = () => {
    this.threadService.sendUserMessage(this.promptText);
    this.promptText = '';

    if (this.preferences.shouldAutoSubmit) {
      this.submitThread();
    }
  };

  submitThread = () => this.threadService.submitThreadToAi();

  onEnterKeyDown = (e: Event): void => {
    if (this.preferences.shouldSendOnEnter) {
      e.preventDefault();
      this.sendMessage();
    }
  };
}
