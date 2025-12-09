import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasinobetsComponent } from './casinobets.component';

describe('CasinobetsComponent', () => {
  let component: CasinobetsComponent;
  let fixture: ComponentFixture<CasinobetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CasinobetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CasinobetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
