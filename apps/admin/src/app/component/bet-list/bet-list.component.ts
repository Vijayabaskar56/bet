import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-bet-list',
  templateUrl: './bet-list.component.html',
  styleUrl: './bet-list.component.scss'
})
export class BetListComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
