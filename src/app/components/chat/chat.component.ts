import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, debounceTime, first, map } from 'rxjs';
import { OpenaiService } from 'src/app/services/openai.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  shouldSendOnEnter = true;
  messages$ = this.openaiService.chatThreadMessages$();
  // messages$ = this.openaiService.chatThreadMessages$(this.threadId).pipe(
  //   map((messages) => {
  //     if (messages) {
  //       messages.forEach((message) => {
  //         message.content = replaceCodeBlocks(message.content);
  //       });
  //     }
  //     return messages;
  //   })
  // );
  promptText = '';

  constructor(
    private openaiService: OpenaiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {}

  onEnterKeyDown = (e: Event): void => {
    console.log(e);
    if (this.shouldSendOnEnter) {
      e.preventDefault();
      this.submitPrompt();
    }
  };

  submitPrompt(): void {
    this.openaiService.sendChatPrompt(this.promptText);
  }
}
