import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlluserListComponent } from './alluser-list.component';

describe('AlluserListComponent', () => {
  let component: AlluserListComponent;
  let fixture: ComponentFixture<AlluserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AlluserListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlluserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
