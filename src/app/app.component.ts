import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  authState$ = this.authService.authState$;

  constructor(private authService: AuthService) {
    this.authState$.subscribe((authState) => {
      if (!authState) {
        this.authService.signIn();
      }
    });
  }
}
