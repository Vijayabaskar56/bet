import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PnlDownlineComponent } from './pnl-downline.component';

describe('PnlDownlineComponent', () => {
  let component: PnlDownlineComponent;
  let fixture: ComponentFixture<PnlDownlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PnlDownlineComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PnlDownlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
