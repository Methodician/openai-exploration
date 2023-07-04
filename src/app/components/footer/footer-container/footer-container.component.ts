import { Component, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FooterName } from 'src/app/models/footer.models';
import { FooterService } from 'src/app/services/footer.service';

@Component({
  selector: 'app-footer-container',
  templateUrl: './footer-container.component.html',
  styleUrls: ['./footer-container.component.scss'],
})
export class FooterContainerComponent {
  private unsubscribe$ = new Subject<void>();
  private footerService = inject(FooterService);
  currentFooter: FooterName = 'NONE';

  ngOnInit(): void {
    this.footerService.currentFooter$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((footerName) => {
        this.currentFooter = footerName;
      });
  }
}
