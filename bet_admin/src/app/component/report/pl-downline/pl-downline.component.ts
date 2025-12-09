import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pl-downline',
  templateUrl: './pl-downline.component.html',
  styleUrl: './pl-downline.component.scss'
})
export class PlDownlineComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
