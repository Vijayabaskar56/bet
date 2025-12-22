import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetLiveListComponent } from './bet-live-list.component';

describe('BetLiveListComponent', () => {
  let component: BetLiveListComponent;
  let fixture: ComponentFixture<BetLiveListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BetLiveListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BetLiveListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
