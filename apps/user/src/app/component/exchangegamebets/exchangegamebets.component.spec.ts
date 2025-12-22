import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangegamebetsComponent } from './exchangegamebets.component';

describe('ExchangegamebetsComponent', () => {
  let component: ExchangegamebetsComponent;
  let fixture: ComponentFixture<ExchangegamebetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExchangegamebetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExchangegamebetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
