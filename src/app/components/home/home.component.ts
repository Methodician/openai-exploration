import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { OpenaiService } from 'src/app/services/openai.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  threads$ = this.openaiService.availableThreads$();

  constructor(private openaiService: OpenaiService, private router: Router) {}

  createNewThread = () => {
    const threadId$ = this.openaiService.createNewThread$();
    threadId$.pipe(first()).subscribe((threadId) => {
      this.router.navigateByUrl(`/chat/${threadId}`);
    });
  };
}
