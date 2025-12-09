import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlBetgamesComponent } from './pl-betgames.component';

describe('PlBetgamesComponent', () => {
  let component: PlBetgamesComponent;
  let fixture: ComponentFixture<PlBetgamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlBetgamesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlBetgamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
