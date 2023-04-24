import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletionsComponent } from './completions.component';

describe('CompletionsComponent', () => {
  let component: CompletionsComponent;
  let fixture: ComponentFixture<CompletionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompletionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompletionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
