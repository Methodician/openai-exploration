import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RouterService {
  scrollOutletToBottom$ = new Subject<void>();

  constructor() {}

  scrollToBottom() {
    this.scrollOutletToBottom$.next();
  }
}
