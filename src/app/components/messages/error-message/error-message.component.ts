import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss'],
})
export class ErrorMessageComponent {
  @Input() threadId?: string;

  error$ = new Subject<any>();

  constructor(private threadService: ThreadService) {}

  ngAfterViewInit() {
    if (!this.threadId) throw new Error('No thread ID provided');
    this.threadService.lastThreadError$(this.threadId).subscribe((error) => {
      if (!error) return;
      this.error$.next(error);
    });
  }
}
