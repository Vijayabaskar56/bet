import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-parlay-downline',
  templateUrl: './parlay-downline.component.html',
  styleUrl: './parlay-downline.component.scss'
})
export class ParlayDownlineComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
