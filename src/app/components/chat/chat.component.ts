import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage } from 'src/app/models/shared';
import { HeaderService } from 'src/app/services/header.service';
import { OpenaiService } from 'src/app/services/openai.service';
import { TokenService } from 'src/app/token.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  shouldSendOnEnter = true;
  messages$ = new BehaviorSubject<ChatMessage[]>([]);
  model = 'gpt-4';
  promptText = '';
  threadId?: string;
  totalTokens$ = this.tokenService.totalTokens$;

  constructor(
    private headerService: HeaderService,
    private openaiService: OpenaiService,
    private tokenService: TokenService,
    private activeRoute: ActivatedRoute
  ) {
    this.tokenService.resetTokenCounts();
  }

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      const threadId = params['threadId'];
      if (threadId) {
        this.threadId = threadId;

        this.openaiService.chatThread$(threadId).subscribe((thread) => {
          if (thread) {
            this.messages$.next(thread.messages);
            this.model = thread.model;
          }
        });
        this.openaiService.chatThreadName$(threadId).subscribe((name) => {
          if (name) {
            this.headerService.setHeaderText(name);
          }
        });
      }
    });
  }

  submitToAi = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    this.openaiService.submitChatThreadToAi(this.threadId);
  };

  renameThread = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    const name = prompt('Enter a new thread name, or nothing to auto generate');

    this.openaiService.renameChatThread(this.threadId, name);
  };

  submitPrompt = async () => {
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

    await this.openaiService.updateChatThreadMessages(
      newMessages,
      this.threadId
    );
    this.promptText = '';
  };

  onEnterKeyDown = (e: Event): void => {
    console.log(e);
    if (this.shouldSendOnEnter) {
      e.preventDefault();
      this.submitPrompt();
    }
  };

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

  // helpers
  trackMessagesByContent = (_: number, message: ChatMessage) => message.content;
}
