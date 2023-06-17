import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss'],
})
export class ErrorMessageComponent {
  error$ = new Subject<any>();

  constructor(private threadService: ThreadService) {}

  ngAfterViewInit() {
    this.threadService.lastThreadError$.subscribe((error) => {
      if (!error) return;
      this.error$.next(error);
    });
  }
}
