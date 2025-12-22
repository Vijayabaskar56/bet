import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pl-diacasino',
  templateUrl: './pl-diacasino.component.html',
  styleUrl: './pl-diacasino.component.scss'
})
export class PlDiacasinoComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
