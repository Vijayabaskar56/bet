import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitsettingsComponent } from './limitsettings.component';

describe('LimitsettingsComponent', () => {
  let component: LimitsettingsComponent;
  let fixture: ComponentFixture<LimitsettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LimitsettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LimitsettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
