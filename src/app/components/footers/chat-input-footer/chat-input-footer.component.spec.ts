import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatInputFooterComponent } from './chat-input-footer.component';

describe('ChatInputFooterComponent', () => {
  let component: ChatInputFooterComponent;
  let fixture: ComponentFixture<ChatInputFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChatInputFooterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatInputFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
