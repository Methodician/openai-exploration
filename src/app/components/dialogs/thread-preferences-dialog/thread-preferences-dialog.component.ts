import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
  thread$ = this.threadService.thread$(this.data.threadId);
  threadPrefs: ThreadPrefs = {
    shouldAutoSubmit: true,
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
  models: ModelSelection[] = [
    { value: 'gpt-4', viewValue: 'GPT-4' },
    { value: 'gpt-4-0314', viewValue: 'GPT-4 (3/14)' },
    { value: 'gpt-4-32k', viewValue: 'GPT-4 (32k)' },
    { value: 'gpt-4-32k-0314', viewValue: 'GPT-4 (32k, 3/14)' },
    { value: 'gpt-3.5-turbo', viewValue: 'GPT-3.5 Turbo' },
    { value: 'gpt-3.5-turbo-0301', viewValue: 'GPT-3.5 Turbo (3/1)' },
  ];
  get maxTokens() {
    switch (this.threadConfig.model) {
      case 'gpt-4':
        return 8192;
      case 'gpt-4-0314':
        return 8192;
      case 'gpt-4-32k':
        return 32768;
      case 'gpt-4-32k-0314':
        return 32768;
      case 'gpt-3.5-turbo':
        return 4097;
      case 'gpt-3.5-turbo-0301':
        return 4097;
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
    this.threadService.getAvailableModels().then((models: any) => {
      const modelIds = models.filter((m: any) => !!m.id).map((m: any) => m.id);
      this.models = this.models.filter((m) => modelIds.includes(m.value));
    });
    this.thread$.subscribe((thread) => {
      if (thread) {
        this.threadPrefs = thread.preferences;
        this.threadConfig = thread.config;
      }
    });
  }

  onModelSelect(event: Event) {
    const model = (event.target as HTMLSelectElement).value;
    this.threadConfig.model = model;
  }

  onSubmit() {
    this.dialogRef.close({
      config: this.threadConfig,
      prefs: this.threadPrefs,
    });
  }
}
