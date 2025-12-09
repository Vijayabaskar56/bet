import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BetGamesComponent } from './bet-games.component';

describe('BetGamesComponent', () => {
  let component: BetGamesComponent;
  let fixture: ComponentFixture<BetGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BetGamesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BetGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
