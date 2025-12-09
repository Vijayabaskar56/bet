import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pnl-casino-downline',
  templateUrl: './pnl-casino-downline.component.html',
  styleUrl: './pnl-casino-downline.component.scss'
})
export class PnlCasinoDownlineComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
