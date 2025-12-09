import { Component } from '@angular/core';
import { BettingService } from '../../services/betting.service';

@Component({
  selector: 'app-exchangegamebets',
  templateUrl: './exchangegamebets.component.html',
  styleUrl: './exchangegamebets.component.scss'
})
export class ExchangegamebetsComponent {
  betHistory : any[] = [];

  constructor(private bettingService: BettingService) { }

  ngOnInit() {
    this.getBetHistory();
  }


  getBetHistory() {
    // this.bettingService.getbetHistory().subscribe((res : any) => {
    //   if(res.success){
    //     this.betHistory = res.success;
    //   }
    // })
  }
}
