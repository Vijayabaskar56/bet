import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportchatComponent } from './supportchat.component';

describe('SupportchatComponent', () => {
  let component: SupportchatComponent;
  let fixture: ComponentFixture<SupportchatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupportchatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SupportchatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
