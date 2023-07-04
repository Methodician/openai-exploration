import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { ThreadConfig, ThreadPrefs } from 'src/app/models/shared';
import { ThreadService } from 'src/app/services/thread.service';

interface ModelSelection {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-thread-preferences-dialog',
  templateUrl: './thread-preferences-dialog.component.html',
  styleUrls: ['./thread-preferences-dialog.component.scss'],
})
export class ThreadPreferencesDialogComponent {
  private unsubscribe$ = new Subject<void>();
  // TODO: break this down into multiple components. Could be in a parent "otherStuffDialog" idunno...
  threadPrefs: ThreadPrefs = {
    shouldAutoSubmit: false,
    shouldSendOnEnter: true,
  };
  threadConfig: ThreadConfig = {
    model: 'gpt-4',
    temperature: 1,
    top_p: 1,
    n: 1,
    presence_penalty: 0.0,
    frequency_penalty: 0.0,
    max_tokens: 4096,
  };
  lastResponse?: any;
  shouldShowLastResponse = false;

  // Note: this would need to be updated manually if the available models change
  models: ModelSelection[] = [
    { value: 'gpt-4', viewValue: 'GPT-4' },
    { value: 'gpt-4-32k', viewValue: 'GPT-4 (32k)' },
    { value: 'gpt-3.5-turbo', viewValue: 'GPT-3.5 Turbo' },
    { value: 'gpt-3.5-turbo-16k', viewValue: 'GPT-3.5 Turbo (16k)' },
  ];
  get maxTokens() {
    switch (this.threadConfig.model) {
      case 'gpt-4':
        return 8192;
      case 'gpt-4-32k':
        return 32768;
      case 'gpt-3.5-turbo':
        return 4097;
      case 'gpt-3.5-turbo-16k':
        return 16384;
      default:
        return 4097;
    }
  }

  constructor(
    public dialogRef: MatDialogRef<ThreadPreferencesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private threadService: ThreadService
  ) {}

  ngOnInit(): void {
    this.threadService.availableModels$().subscribe((models) => {
      const gptOnly = models.filter((m) => m.id.includes('gpt'));
      console.log(gptOnly);
      const modelIds = models.filter((m) => !!m.id).map((m) => m.id);
      this.models = this.models.filter((m) => modelIds.includes(m.value));
    });

    this.threadService.currentThreadPreferences$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((prefs) => {
        if (prefs) {
          this.threadPrefs = {
            ...this.threadPrefs,
            ...(prefs || {}),
          };
        }
      });

    this.threadService.currentThreadConfig$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((config) => {
        if (config) {
          this.threadConfig = {
            ...this.threadConfig,
            ...(config || {}),
          };
        }
      });

    this.threadService.currentThreadLastSuccess$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((lastResponse) => {
        if (lastResponse) {
          this.lastResponse = lastResponse;
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onModelSelect = (event: Event) => {
    const model = (event.target as HTMLSelectElement).value;
    this.threadConfig.model = model;
  };

  onSave = () => {
    this.dialogRef.close({
      config: this.threadConfig,
      prefs: this.threadPrefs,
      shouldDelete: false,
    });
  };

  onDelete = () => {
    const shouldDelete = confirm(
      'Are you sure you want to delete this thread? This cannot be undone.'
    );
    if (!shouldDelete) {
      return;
    }
    this.dialogRef.close({
      config: this.threadConfig,
      prefs: this.threadPrefs,
      shouldDelete: true,
    });
  };
}
