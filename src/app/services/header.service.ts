import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  headerText$ = new BehaviorSubject<string>('GPT Pro'); // the search query

  constructor() {}

  setHeaderText = (text: string) => {
    this.headerText$.next(text);
  };
}
