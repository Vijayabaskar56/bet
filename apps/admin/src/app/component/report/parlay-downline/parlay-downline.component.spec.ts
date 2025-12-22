import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParlayDownlineComponent } from './parlay-downline.component';

describe('ParlayDownlineComponent', () => {
  let component: ParlayDownlineComponent;
  let fixture: ComponentFixture<ParlayDownlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParlayDownlineComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParlayDownlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
