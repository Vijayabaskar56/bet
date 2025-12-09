import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupermasterComponent } from './supermaster.component';

describe('SupermasterComponent', () => {
  let component: SupermasterComponent;
  let fixture: ComponentFixture<SupermasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupermasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SupermasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
