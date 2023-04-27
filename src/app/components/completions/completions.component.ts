import { Component } from '@angular/core';
import { OpenaiService } from 'src/app/services/openai.service';

@Component({
  selector: 'app-completions',
  templateUrl: './completions.component.html',
  styleUrls: ['./completions.component.scss'],
})
export class CompletionsComponent {
  promptText = '';
  lastResponse: any = null;
  // May eventually make the selection between completions and other configs more fluid based on the exchange, more similar to playground
  constructor(private openaiService: OpenaiService) {}

  onPrompt = () => {
    const promptKey = this.openaiService.sendCompletionPrompt(this.promptText);
    console.log('promptKey', promptKey);
    this.openaiService.completionResponse$(promptKey).subscribe((response) => {
      console.log('response', response);
      this.lastResponse = response;
    });
  };
}
