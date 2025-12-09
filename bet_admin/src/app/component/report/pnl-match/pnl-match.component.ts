import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pnl-match',
  templateUrl: './pnl-match.component.html',
  styleUrl: './pnl-match.component.scss'
})
export class PnlMatchComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
