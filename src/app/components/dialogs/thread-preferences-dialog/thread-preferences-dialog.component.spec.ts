import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadPreferencesDialogComponent } from './thread-preferences-dialog.component';

describe('ThreadPreferencesDialogComponent', () => {
  let component: ThreadPreferencesDialogComponent;
  let fixture: ComponentFixture<ThreadPreferencesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreadPreferencesDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadPreferencesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
