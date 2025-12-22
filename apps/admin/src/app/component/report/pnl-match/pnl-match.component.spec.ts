import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PnlMatchComponent } from './pnl-match.component';

describe('PnlMatchComponent', () => {
  let component: PnlMatchComponent;
  let fixture: ComponentFixture<PnlMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PnlMatchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PnlMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
