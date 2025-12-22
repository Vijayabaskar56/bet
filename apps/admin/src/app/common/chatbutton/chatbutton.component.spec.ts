import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatbuttonComponent } from './chatbutton.component';

describe('ChatbuttonComponent', () => {
  let component: ChatbuttonComponent;
  let fixture: ComponentFixture<ChatbuttonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatbuttonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChatbuttonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
