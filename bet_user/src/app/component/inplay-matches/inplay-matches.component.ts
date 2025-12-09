import { Component } from '@angular/core';
import { BettingService } from '../../services/betting.service';

@Component({
  selector: 'app-inplay-matches',
  templateUrl: './inplay-matches.component.html',
  styleUrl: './inplay-matches.component.scss'
})
export class InplayMatchesComponent {
  matches : any[]
  constructor(private bettingService: BettingService){
    this.matches =  [];
  }

  ngOnInit() { 
    this.getLiveMatches();
  }

  getLiveMatches() {
    this.bettingService.getLiveMatches().subscribe((response : any) => {
      if(response.success) {
        this.matches =  response.data.map((sport : any) => {
          return {
            ...sport,
            matchList : sport.matchList.filter((m : any) => m.inPlay)
          }
        });
      }
    })
  }

}
