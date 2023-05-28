import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { HeaderService } from 'src/app/services/header.service';
import { ThreadService } from 'src/app/services/thread.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  private headerService = inject(HeaderService);
  private threadService = inject(ThreadService);
  private router = inject(Router);
  private authService = inject(AuthService);
  threads$ = this.threadService.allThreads$();

  ngOnInit(): void {
    this.headerService.setHeaderText('AI Power User');
  }

  onSignOut = () => {
    this.authService.signOut();
  };

  createNewThread = () => {
    const threadId$ = this.threadService.createNewThread$();
    threadId$.pipe(first()).subscribe(
      (threadId) => {
        this.router.navigateByUrl(`/chat/${threadId}`);
      },
      (error) => {
        if (error.message) {
          alert(error.message);
        }
        console.log(error.code);

        if (error.code !== 'functions/unauthenticated') {
          console.error(error);
        }
      }
    );
  };
}
