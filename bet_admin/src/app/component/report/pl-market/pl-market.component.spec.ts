import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlMarketComponent } from './pl-market.component';

describe('PlMarketComponent', () => {
  let component: PlMarketComponent;
  let fixture: ComponentFixture<PlMarketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlMarketComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlMarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
