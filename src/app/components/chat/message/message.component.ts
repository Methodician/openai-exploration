import { Component, Input, SimpleChanges } from '@angular/core';
import { ChatMessage } from 'src/app/models/shared';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent {
  @Input() rawMessage?: ChatMessage;
  message?: {
    role: 'user' | 'assistant' | 'system';
    segments: { type: 'text' | 'code'; content: string }[];
  };

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    const messageChanges = changes['rawMessage'];
    if (messageChanges) {
      const { segments } = this.extractSegments(
        messageChanges.currentValue.content
      );
      this.message = { ...messageChanges.currentValue, segments };
    }
  }

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
