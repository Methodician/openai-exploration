import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'openai-exploration';

  constructor(private authService: AuthService) {
    this.authService.authState$.subscribe((authState) => {
      if (!authState) {
        this.authService.signIn();
      }
    });
  }
}
