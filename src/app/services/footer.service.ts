import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FooterName } from '../models/footer.models';

@Injectable({
  providedIn: 'root',
})
export class FooterService {
  currentFooter$ = new BehaviorSubject<FooterName>('NONE');

  constructor() {}

  setFooter(footerName: FooterName) {
    this.currentFooter$.next(footerName);
  }
}
