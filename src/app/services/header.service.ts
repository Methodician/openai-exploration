import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  headerText$ = new BehaviorSubject<string>('GPT Pro'); // the search query
  otherStuffClicked$ = new Subject<void>();

  constructor() {}

  setHeaderText = (text: string) => {
    this.headerText$.next(text);
  };

  otherStuffClicked = () => {
    this.otherStuffClicked$.next();
  };
}
