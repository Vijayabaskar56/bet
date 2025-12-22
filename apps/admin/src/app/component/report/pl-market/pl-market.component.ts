import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pl-market',
  templateUrl: './pl-market.component.html',
  styleUrl: './pl-market.component.scss'
})
export class PlMarketComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
