import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ThreadMessage } from 'src/app/models/shared';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent {
  @Input() rawMessage?: ThreadMessage;
  @Output() onMessageUpdate = new EventEmitter<{
    key: string;
    newContent: string;
  }>();
  @Output() onMessageDelete = new EventEmitter<string>();
  isEditing = false;
  message?: {
    role: 'user' | 'assistant' | 'system';
    segments: { type: 'text' | 'code'; content: string }[];
    tokenCount: number;
  };
  rawContent?: string;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    const messageChanges = changes['rawMessage'];
    if (messageChanges) {
      const val = messageChanges.currentValue;
      if (!val || val.content === this.rawContent) return;
      this.rawContent = val.content;
      const { segments } = this.extractSegments(
        messageChanges.currentValue.content
      );
      this.message = { ...messageChanges.currentValue, segments };
    }
  }

  updateMessage = () => {
    if (this.rawMessage?.key === undefined)
      throw new Error('No message key provided');
    if (!this.rawContent) throw new Error('No content provided');
    this.onMessageUpdate.emit({
      key: this.rawMessage.key,
      newContent: this.rawContent,
    });
    this.isEditing = false;
  };

  deleteMessage = () => {
    if (this.rawMessage?.key === undefined)
      throw new Error('No message key provided');
    this.onMessageDelete.emit(this.rawMessage.key);
  };

  extractSegments(input: string): {
    segments: Array<{ type: 'text' | 'code'; content: string }>;
  } {
    const segments: Array<{ type: 'text' | 'code'; content: string }> = [];
    const regex = /```([^`]+)```/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(input)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: input.slice(lastIndex, match.index),
        });
      }
      segments.push({
        type: 'code',
        content: match[1],
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < input.length) {
      segments.push({
        type: 'text',
        content: input.slice(lastIndex),
      });
    }

    return { segments };
  }
}
