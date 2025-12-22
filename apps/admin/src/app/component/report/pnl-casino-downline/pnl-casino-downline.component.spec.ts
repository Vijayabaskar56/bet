import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PnlCasinoDownlineComponent } from './pnl-casino-downline.component';

describe('PnlCasinoDownlineComponent', () => {
  let component: PnlCasinoDownlineComponent;
  let fixture: ComponentFixture<PnlCasinoDownlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PnlCasinoDownlineComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PnlCasinoDownlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
