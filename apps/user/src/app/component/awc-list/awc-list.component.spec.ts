import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AwcListComponent } from './awc-list.component';

describe('AwcListComponent', () => {
  let component: AwcListComponent;
  let fixture: ComponentFixture<AwcListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AwcListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AwcListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
