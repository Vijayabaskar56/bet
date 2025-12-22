import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankinglogComponent } from './bankinglog.component';

describe('BankinglogComponent', () => {
  let component: BankinglogComponent;
  let fixture: ComponentFixture<BankinglogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BankinglogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BankinglogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
