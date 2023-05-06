import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { encoding_for_model, TiktokenModel } from '@dqbd/tiktoken';
import { ChatMessage } from './models/shared';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  totalTokens$ = new BehaviorSubject<number>(0);
  model = 'gpt-4';

  constructor() {}

  setModel = (model: string) => {
    this.model = model;
  };

  resetTokenCounts = () => {
    this.totalTokens$.next(0);
  };

  countTokens = (message: ChatMessage) => {
    const chatEnabledModels = [
      'gpt-4',
      'gpt-4-0314',
      'gpt-4-32k',
      'gpt-4-32k-0314',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0301',
    ];
    if (!chatEnabledModels.includes(this.model)) {
      throw new Error('Model not supported');
    }
    const encoding = encoding_for_model(this.model as TiktokenModel);
    const tokensPerMessage = this.model.includes('3.5') ? 4 : 3; // subject to change and assumes 4 is only alt
    const tokensPerName = this.model.includes('3.5') ? -1 : 1; // subject to change and assumes 4 is only alt
    let tokensInMessage = tokensPerMessage;
    for (let [key, val] of Object.entries(message)) {
      tokensInMessage += encoding.encode(val).length;
      if (key === 'name') {
        tokensInMessage += tokensPerName;
      }
    }
    this.totalTokens$.next(this.totalTokens$.getValue() + tokensInMessage);
    return tokensInMessage;
  };
}
