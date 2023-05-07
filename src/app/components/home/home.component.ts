import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { HeaderService } from 'src/app/services/header.service';
import { OpenaiService } from 'src/app/services/openai.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  threads$ = this.openaiService.availableThreads$();

  constructor(
    private headerService: HeaderService,
    private openaiService: OpenaiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.headerService.setHeaderText('AI Power User');
  }

  createNewThread = () => {
    const threadId$ = this.openaiService.createNewThread$();
    threadId$.pipe(first()).subscribe((threadId) => {
      this.router.navigateByUrl(`/chat/${threadId}`);
    });
  };
}
