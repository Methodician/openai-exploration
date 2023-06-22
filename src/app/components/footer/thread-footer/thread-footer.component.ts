import { Component, inject } from '@angular/core';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-thread-footer',
  templateUrl: './thread-footer.component.html',
  styleUrls: ['./thread-footer.component.scss'],
})
export class ThreadFooterComponent {
  private threadService = inject(ThreadService);
  // metadata$ = this.threadService;
}
