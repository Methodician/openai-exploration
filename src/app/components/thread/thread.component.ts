import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ThreadConfig, ThreadPrefs } from 'src/app/models/shared';
import { HeaderService } from 'src/app/services/header.service';
import { ThreadService } from 'src/app/services/thread.service';
import { MatDialog } from '@angular/material/dialog';
import { ThreadPreferencesDialogComponent } from '../dialogs/thread-preferences-dialog/thread-preferences-dialog.component';
import { FooterService } from 'src/app/services/footer.service';

@Component({
  selector: 'app-thread',
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'],
})
export class ThreadComponent implements OnInit {
  private unsubscribe$ = new Subject<void>();
  model = 'gpt-4';

  constructor(
    private footerService: FooterService,
    private headerService: HeaderService,
    private threadService: ThreadService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.footerService.setFooter('THREAD');
    this.headerService.isTitleClickable$.next(true);
    this.headerService.isThereOtherStuff$.next(true);

    this.threadService.currentThreadMetadata$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((metadata) => {
        if (metadata) {
          this.headerService.setHeaderText(metadata.name);
        }
      });

    this.headerService.otherStuffClicked$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.openThreadPrefsDialog();
      });

    this.headerService.titleClicked$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.renameThread();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.footerService.setFooter('NONE');
    this.headerService.isTitleClickable$.next(false);
    this.headerService.setHeaderText('AI Power User');
    this.headerService.isThereOtherStuff$.next(false);
  }

  openThreadPrefsDialog = () => {
    const dialogRef = this.dialog.open(ThreadPreferencesDialogComponent, {
      width: '700px',
      panelClass: 'settings-dialog',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (result?: {
          config: ThreadConfig;
          prefs: ThreadPrefs;
          shouldDelete: boolean;
        }) => {
          if (!result) {
            return;
          }
          if (result.shouldDelete) {
            this.deleteThread();
            return;
          } else {
            this.saveConfig(result.config, result.prefs);
          }
        }
      );
  };

  renameThread = () => {
    const name = prompt('Enter a new thread name, or nothing to auto generate');
    if (name !== null) {
      this.threadService.renameCurrentThread(name);
    }
  };

  saveConfig = (config: ThreadConfig, prefs: ThreadPrefs) => {
    this.threadService.updateCurrentThreadConfig(config);
    this.threadService.updateCurrentThreadPrefs(prefs);
  };

  deleteThread = async () => {
    await this.threadService.deleteCurrentThread();
    this.router.navigate(['/']);
  };
}
