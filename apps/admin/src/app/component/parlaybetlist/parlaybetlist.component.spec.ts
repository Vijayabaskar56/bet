import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParlaybetlistComponent } from './parlaybetlist.component';

describe('ParlaybetlistComponent', () => {
  let component: ParlaybetlistComponent;
  let fixture: ComponentFixture<ParlaybetlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParlaybetlistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParlaybetlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
