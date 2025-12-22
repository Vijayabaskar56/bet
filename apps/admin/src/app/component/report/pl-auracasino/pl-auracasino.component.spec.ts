import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlAuracasinoComponent } from './pl-auracasino.component';

describe('PlAuracasinoComponent', () => {
  let component: PlAuracasinoComponent;
  let fixture: ComponentFixture<PlAuracasinoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlAuracasinoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlAuracasinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
