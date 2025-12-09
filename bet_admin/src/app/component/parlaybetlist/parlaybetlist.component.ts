import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-parlaybetlist',
  templateUrl: './parlaybetlist.component.html',
  styleUrl: './parlaybetlist.component.scss'
})
export class ParlaybetlistComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
