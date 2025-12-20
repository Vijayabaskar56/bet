import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentBetComponent } from './current-bet.component';

describe('CurrentBetComponent', () => {
  let component: CurrentBetComponent;
  let fixture: ComponentFixture<CurrentBetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CurrentBetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentBetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
