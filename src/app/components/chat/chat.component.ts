import { Component } from '@angular/core';
import { OpenaiService } from 'src/app/services/openai.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  shouldSendOnEnter = true;
  messages$ = this.openaiService.chatThreadMessages$();
  promptText = '';

  constructor(private openaiService: OpenaiService) {}

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
