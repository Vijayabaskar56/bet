import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FancybetsComponent } from './fancybets.component';

describe('FancybetsComponent', () => {
  let component: FancybetsComponent;
  let fixture: ComponentFixture<FancybetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FancybetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FancybetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
