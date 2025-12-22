import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetgamebettinghistoryComponent } from './betgamebettinghistory.component';

describe('BetgamebettinghistoryComponent', () => {
  let component: BetgamebettinghistoryComponent;
  let fixture: ComponentFixture<BetgamebettinghistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BetgamebettinghistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BetgamebettinghistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
