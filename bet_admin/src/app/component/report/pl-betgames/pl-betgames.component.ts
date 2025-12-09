import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pl-betgames',
  templateUrl: './pl-betgames.component.html',
  styleUrl: './pl-betgames.component.scss'
})
export class PlBetgamesComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
