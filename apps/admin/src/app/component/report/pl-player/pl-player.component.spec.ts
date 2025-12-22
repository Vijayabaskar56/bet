import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlPlayerComponent } from './pl-player.component';

describe('PlPlayerComponent', () => {
  let component: PlPlayerComponent;
  let fixture: ComponentFixture<PlPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlPlayerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
