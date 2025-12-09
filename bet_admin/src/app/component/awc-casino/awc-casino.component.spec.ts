import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AwcCasinoComponent } from './awc-casino.component';

describe('AwcCasinoComponent', () => {
  let component: AwcCasinoComponent;
  let fixture: ComponentFixture<AwcCasinoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AwcCasinoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AwcCasinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
