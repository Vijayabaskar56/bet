import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InplayMatchesComponent } from './inplay-matches.component';

describe('InplayMatchesComponent', () => {
  let component: InplayMatchesComponent;
  let fixture: ComponentFixture<InplayMatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InplayMatchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InplayMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
