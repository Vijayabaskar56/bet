import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pnl-downline',
  templateUrl: './pnl-downline.component.html',
  styleUrl: './pnl-downline.component.scss'
})
export class PnlDownlineComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
