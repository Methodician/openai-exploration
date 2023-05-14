import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  headerText$ = new BehaviorSubject<string>('GPT Pro');
  isTitleClickable$ = new BehaviorSubject<boolean>(false);
  titleClicked$ = new Subject<void>();
  otherStuffClicked$ = new Subject<void>();

  constructor() {}

  setHeaderText = (text: string) => {
    this.headerText$.next(text);
  };

  setTitleClickable = (isClickable: boolean) => {
    this.isTitleClickable$.next(isClickable);
  };

  titleClicked = () => {
    this.titleClicked$.next();
  };

  otherStuffClicked = () => {
    this.otherStuffClicked$.next();
  };
}
