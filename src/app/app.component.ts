import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { RouterService } from './services/router.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild('main', { read: ElementRef })
  private mainElRef?: ElementRef;

  private authService = inject(AuthService);
  private routerService = inject(RouterService);
  authState$ = this.authService.authState$;

  ngOnInit(): void {
    this.authState$.subscribe((authState) => {
      if (!authState) {
        this.authService.signIn();
      }
    });

    this.routerService.scrollOutletToBottom$.subscribe(() => {
      this.scrollToBottom();
    });
  }

  scrollToBottom = () => {
    if (!!this.mainElRef) {
      this.mainElRef.nativeElement.scrollTop =
        this.mainElRef.nativeElement.scrollHeight;
    }
  };
}
