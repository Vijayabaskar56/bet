import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-awc-casino',
  templateUrl: './awc-casino.component.html',
  styleUrl: './awc-casino.component.scss'
})
export class AwcCasinoComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
