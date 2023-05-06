import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ChatMessage } from 'src/app/models/shared';
import { TokenService } from 'src/app/token.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent {
  @Input() rawMessage?: ChatMessage;
  @Input() index?: number;
  @Output() onMessageUpdate = new EventEmitter<{
    index: number;
    newContent: string;
  }>();
  @Output() onMessageDelete = new EventEmitter<number>();
  tokenCount = 0;
  isEditing = false;
  message?: {
    role: 'user' | 'assistant' | 'system';
    segments: { type: 'text' | 'code'; content: string }[];
  };
  rawContent?: string;

  constructor(private tokenService: TokenService) {}

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
      setTimeout(() => {
        // Makes the messages appear immediately without counts
        this.tokenCount = this.tokenService.countTokens(val);
      }, 0);
    }
  }

  updateMessage = () => {
    if (this.index === undefined) throw new Error('No index provided');
    if (!this.rawContent) throw new Error('No content provided');
    this.onMessageUpdate.emit({
      index: this.index,
      newContent: this.rawContent,
    });
    this.isEditing = false;
  };

  deleteMessage = () => {
    if (this.index === undefined) throw new Error('No index provided');
    this.onMessageDelete.emit(this.index);
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
