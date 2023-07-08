import { Component, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss'],
})
export class ErrorMessageComponent {
  private unsubscribe$ = new Subject<void>();
  private threadService = inject(ThreadService);
  error: any;

  ngAfterViewInit() {
    this.threadService.currentThreadLastError$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((error) => {
        if (!error) return;
        this.error = error;
      });
  }
}
