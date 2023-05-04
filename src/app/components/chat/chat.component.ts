import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage } from 'src/app/models/shared';
import { OpenaiService } from 'src/app/services/openai.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  shouldSendOnEnter = true;
  messages$ = new BehaviorSubject<ChatMessage[]>([]);
  promptText = '';
  threadId?: string;

  constructor(
    private openaiService: OpenaiService,
    private activeRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      const threadId = params['threadId'];
      if (threadId) {
        this.threadId = threadId;
        this.openaiService
          .chatThreadMessages$(threadId)
          .subscribe((messages) => {
            if (messages) {
              this.messages$.next(messages);
            }
          });
      }
    });
  }

  onEnterKeyDown = (e: Event): void => {
    console.log(e);
    if (this.shouldSendOnEnter) {
      e.preventDefault();
      this.submitPrompt();
    }
  };

  submitToAi = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    this.openaiService.submitChatThreadToAi(this.threadId);
  };

  submitPrompt(): void {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    if (!this.promptText) {
      alert('Please enter a prompt');
      return;
    }

    const messages = this.messages$.getValue();
    const newMessage: ChatMessage = {
      content: this.promptText,
      role: 'user',
    };
    const newMessages = [...messages, newMessage];

    this.openaiService.updateChatThreadMessages(newMessages, this.threadId);
  }

  updateMessage = ($event: { index: number; newContent: string }) => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    const { index, newContent } = $event;
    const messages = this.messages$.getValue();
    const newMessages = [
      ...messages.slice(0, index),
      { ...messages[index], content: newContent },
      ...messages.slice(index + 1),
    ];

    this.openaiService.updateChatThreadMessages(newMessages, this.threadId);
  };

  deleteMessage = (index: number) => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    if (index === 0) {
      alert(
        'Cannot delete the first message. This is the system message. You could just leave it blank.'
      );
      return;
    }
    const messages = this.messages$.getValue();
    const newMessages = messages.filter((_, i) => i !== index);
    this.openaiService.updateChatThreadMessages(newMessages, this.threadId);
  };
}
