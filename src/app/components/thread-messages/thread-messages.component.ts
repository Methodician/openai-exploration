import { Component, ElementRef, ViewChild } from '@angular/core';
import { map, startWith } from 'rxjs';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-thread-messages',
  templateUrl: './thread-messages.component.html',
  styleUrls: ['./thread-messages.component.scss'],
})
export class ThreadMessagesComponent {
  messages$ = this.threadService.threadMessages$;
  metadata$ = this.threadService.threadMetadata$;
  @ViewChild('messageHistory', { read: ElementRef })
  isAiGenerating$ = this.metadata$.pipe(
    map((metadata) => (!metadata ? false : metadata.isAiGenerating)),
    startWith(false) // is this needed?
  );

  constructor(private threadService: ThreadService) {}
  updateMessage = ($event: { key: string; newContent: string }) => {
    const { key, newContent } = $event;
    this.threadService.updateThreadMessage(key, newContent);
  };

  deleteMessage = (messageKey: string) =>
    this.threadService.deleteThreadMessage(messageKey);
}
