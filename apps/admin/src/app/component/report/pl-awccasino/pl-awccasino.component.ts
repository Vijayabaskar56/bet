import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pl-awccasino',
  templateUrl: './pl-awccasino.component.html',
  styleUrl: './pl-awccasino.component.scss'
})
export class PlAwccasinoComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
