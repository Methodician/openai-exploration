import { Component, inject } from '@angular/core';
import { Observable, Subject, firstValueFrom, takeUntil } from 'rxjs';
import {
  ThreadConfig,
  ThreadMetadata,
  ThreadPrefs,
} from 'src/app/models/shared';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-thread-footer',
  templateUrl: './thread-footer.component.html',
  styleUrls: ['./thread-footer.component.scss'],
})
export class ThreadFooterComponent {
  private threadService = inject(ThreadService);
  private unsubscribe$ = new Subject<void>();
  preferences?: ThreadPrefs;
  metadata?: ThreadMetadata;
  config?: ThreadConfig;
  promptText = '';

  ngOnInit(): void {
    this.threadService.currentThreadPreferences$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((prefs) => {
        this.preferences = prefs;
      });

    this.threadService.currentThreadMetadata$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((metadata) => {
        this.metadata = metadata;
      });

    this.threadService.currentThreadConfig$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((config) => {
        this.config = config;
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  submitThread = async () => this.threadService.submitCurrentThread();

  sendMessage = async () => {
    await this.threadService.sendUserMessage(this.promptText);
    this.promptText = '';

    if (this.preferences?.shouldAutoSubmit) {
      this.submitThread();
    }
  };

  onEnterKeyDown = (e: KeyboardEvent): void => {
    if (this.preferences?.shouldSendOnEnter && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  };

  toKeyboardEvent = (e: Event) => e as KeyboardEvent;
}
