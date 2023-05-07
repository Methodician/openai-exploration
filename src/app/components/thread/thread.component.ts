import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { ThreadMessage } from 'src/app/models/shared';
import { HeaderService } from 'src/app/services/header.service';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})
export class ThreadComponent implements OnInit {
  @ViewChild('messageHistory', { read: ElementRef })
  private messageHistory?: ElementRef;
  preferences: any = {};
  model = 'gpt-4';
  promptText = '';
  threadId?: string;
  messages$ = new Subject<any>();
  metadata$ = new Subject<any>();

  constructor(
    private headerService: HeaderService,
    private threadService: ThreadService,
    private activeRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activeRoute.params.subscribe((params) => {
      const threadId = params['threadId'];
      if (threadId) {
        this.threadId = threadId;

        this.threadService.threadMetadata$(threadId).subscribe((metadata) => {
          if (metadata) {
            this.metadata$.next(metadata);
            this.headerService.setHeaderText(metadata.name);
          }
        });

        this.threadService.threadMessages$(threadId).subscribe((messages) => {
          if (messages) {
            this.messages$.next(messages);
            setTimeout(() => {
              // pushes down the call stack so the element has a chance to exist
              if (this.messageHistory?.nativeElement) {
                this.scrollToBottom();
              }
            });
          }
        });

        this.threadService
          .threadPreferences$(threadId)
          .subscribe((preferences) => {
            if (preferences) {
              this.preferences = preferences;
            }
          });
      }
    });
  }

  scrollToBottom = () => {
    if (!!this.messageHistory) {
      this.messageHistory.nativeElement.scrollTop =
        this.messageHistory.nativeElement.scrollHeight;
    }
  };

  sendMessage = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    this.threadService.sendUserMessage(this.threadId, this.promptText);
    this.promptText = '';
  };

  submitThread = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    this.threadService.submitThreadToAi(this.threadId);
  };

  renameThread = () => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    const name = prompt('Enter a new thread name, or nothing to auto generate');

    this.threadService.renameThread(this.threadId, name);
  };

  // from chat.component.ts
  // submitToAi = () => {
  //   if (!this.threadId) {
  //     throw new Error('No thread id');
  //   }

  //   this.openaiService.submitChatThreadToAi(this.threadId);
  // };

  // renameThread = () => {
  //   if (!this.threadId) {
  //     throw new Error('No thread id');
  //   }
  //   const name = prompt('Enter a new thread name, or nothing to auto generate');

  //   this.openaiService.renameChatThread(this.threadId, name);
  // };

  // submitPrompt = async () => {
  //   if (!this.threadId) {
  //     throw new Error('No thread id');
  //   }
  //   if (!this.promptText) {
  //     alert('Please enter a prompt');
  //     return;
  //   }

  //   const messages = this.messages$.getValue();
  //   const newMessage: RequestMessage = {
  //     content: this.promptText,
  //     role: 'user',
  //   };
  //   const newMessages = [...messages, newMessage];

  //   await this.openaiService.updateChatThreadMessages(
  //     newMessages,
  //     this.threadId
  //   );
  //   this.promptText = '';
  // };

  onEnterKeyDown = (e: Event): void => {
    console.log(e);
    if (this.preferences.shouldSendOnEnter) {
      e.preventDefault();
      this.sendMessage();
    }
  };

  updateMessage = ($event: { key: string; newContent: string }) => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }

    const { key, newContent } = $event;
    this.threadService.updateThreadMessage(this.threadId, key, newContent);
    // const messages = this.messages$.getValue();
    // const newMessages = [
    //   ...messages.slice(0, index),
    //   { ...messages[index], content: newContent },
    //   ...messages.slice(index + 1),
    // ];

    // this.openaiService.updateChatThreadMessages(newMessages, this.threadId);
  };

  deleteMessage = (messageKey: string) => {
    if (!this.threadId) {
      throw new Error('No thread id');
    }
    this.threadService.deleteThreadMessage(this.threadId, messageKey);
    // if (index === 0) {
    //   alert(
    //     'Cannot delete the first message. This is the system message. You could just leave it blank.'
    //   );
    //   return;
    // }
    // const messages = this.messages$.getValue();
    // const newMessages = messages.filter((_, i) => i !== index);
    // this.openaiService.updateChatThreadMessages(newMessages, this.threadId);
  };

  // helpers
  trackMessagesByContent = (_: number, message: ThreadMessage) =>
    message.content;
}
