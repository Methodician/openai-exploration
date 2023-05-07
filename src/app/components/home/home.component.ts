import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { HeaderService } from 'src/app/services/header.service';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  threads$ = this.threadService.allThreads$();

  constructor(
    private headerService: HeaderService,
    private threadService: ThreadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.headerService.setHeaderText('AI Power User');
  }

  createNewThread = () => {
    const threadId$ = this.threadService.createNewThread$();
    threadId$.pipe(first()).subscribe((threadId) => {
      this.router.navigateByUrl(`/chat/${threadId}`);
    });
  };
}
