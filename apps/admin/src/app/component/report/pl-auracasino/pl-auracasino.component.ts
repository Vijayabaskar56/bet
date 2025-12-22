import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pl-auracasino',
  templateUrl: './pl-auracasino.component.html',
  styleUrl: './pl-auracasino.component.scss'
})
export class PlAuracasinoComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
