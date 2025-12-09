import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AwcbetsComponent } from './awcbets.component';

describe('AwcbetsComponent', () => {
  let component: AwcbetsComponent;
  let fixture: ComponentFixture<AwcbetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AwcbetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AwcbetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
