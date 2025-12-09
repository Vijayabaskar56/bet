import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-bet-games',
  templateUrl: './bet-games.component.html',
  styleUrl: './bet-games.component.scss'
})
export class BetGamesComponent {
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
}
