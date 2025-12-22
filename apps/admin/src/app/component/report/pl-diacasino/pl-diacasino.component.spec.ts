import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlDiacasinoComponent } from './pl-diacasino.component';

describe('PlDiacasinoComponent', () => {
  let component: PlDiacasinoComponent;
  let fixture: ComponentFixture<PlDiacasinoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlDiacasinoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlDiacasinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
