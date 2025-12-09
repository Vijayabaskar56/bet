import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pl-player',
  templateUrl: './pl-player.component.html',
  styleUrl: './pl-player.component.scss'
})
export class PlPlayerComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
