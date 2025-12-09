import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlDownlineComponent } from './pl-downline.component';

describe('PlDownlineComponent', () => {
  let component: PlDownlineComponent;
  let fixture: ComponentFixture<PlDownlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlDownlineComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlDownlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
