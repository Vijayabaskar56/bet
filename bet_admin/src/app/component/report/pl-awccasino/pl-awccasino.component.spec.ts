import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlAwccasinoComponent } from './pl-awccasino.component';

describe('PlAwccasinoComponent', () => {
  let component: PlAwccasinoComponent;
  let fixture: ComponentFixture<PlAwccasinoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlAwccasinoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlAwccasinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
