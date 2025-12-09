import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BettingService } from '../../services/betting.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UserServices } from '../../services/user.service';
import { SocketService } from '../../services/socket.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-match-details',
  templateUrl: './match-details.component.html',
  styleUrl: './match-details.component.scss'
})
export class MatchDetailsComponent implements OnDestroy {
[x: string]: any;
  matchId: any;
  sportId: any;
  matchDetails: any;
  matchOdds: any[] = [];
  sanitizedUrl: SafeResourceUrl | null = null;
  selectedId:any;
  betInputVisible: boolean = false;
  selectedRunner: any = {
    name: "home",
    selectionId: "xxxx",
    marketId : "yyyy"
  };

  betForm!: FormGroup;
  betType: 'back' | 'lay' = 'back';
  matchedBets : any[] = [];
  unmatchedBets : any[] = [];
  isLoading : boolean = true;
  bookmakerOdds: any[] = [];
  bookmakerOddsList: any[] = [];
  bookmakerMarketId : string | null = null;
  bookmakerVisible:boolean = false;
  fancyOdds: any[] = [];
  limitSettings : any = {
    fancy : {
      minBet : 1,
      maxBet : 1000
    },
    bookmark : {
      minBet : 1,
      maxBet : 1000
    },
    match : {
      minBet : 1,
      maxBet : 1000
    },
  };
  selectionId : any = null;
  isMobile : boolean = false
  constructor(
    private route: ActivatedRoute,
    private bettingService: BettingService,
    private sanitizer: DomSanitizer,
    private userService: UserServices,
    private socketService: SocketService,
    private fb: FormBuilder
  ) {
    this.betForm = this.fb.group({
      odds: [{ value: 0.01, disabled: false }], // Default odds
      fancyOdd: [0], // Default stake
      stake: [100], // Default stake
      profit: [0], // Profit calculation
      liability: [0], // Liability calculation,
      marketType : [1] // Market Type -> 1 - match odds, 2 -> bookmaker odds
    });

    this.betForm.valueChanges.subscribe(() => this.calculateProfitAndLiability());

  }

  isMarketOdds = () => (this.betForm.value.marketType == 1);

  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if(this.matchId != params['matchId']) {
        this.upsubscribeCurrentEvent();
        this.sportId = params['sportId'];
        this.matchId = params['matchId'];
        this.getMatchDetails();
      }

    });
    this.checkScreenSize();
  }

  getMatchDetails() {
    this.bettingService.getMatchOdds(this.sportId, this.matchId).subscribe((response: any) => {
      if (response.success) {
        this.matchDetails = response.data?.details;
        this.matchOdds = response.data?.matchOdds;
        this.bookmakerOdds = response.data?.bookmakerOdds;
        this.bookmakerOddsList = Object.values(
          response.data?.bookmakerOdds.reduce((acc: any, item: any) => {
              if (!acc[item.t]) {
                  acc[item.t] = { title: item.t, eventList: [] };
              }
              acc[item.t].eventList.push(item);
              return acc;
          }, {})
        );
      

        this.limitSettings = response.data?.limitSettings;
        this.fancyOdds = response.data?.fancyOdds?.sort((a : any, b : any) => a?.srno - b?.srno) || [];
        this.sanitizedUrl = this.sanitizeUrl(this.matchDetails.scoreUrl);
        this.subscribeLiveUpdate(this.matchDetails?.matchId);
        this.getCurrentBets(this.matchDetails?.matchId);
      }
    })
    
  }

  getCurrentBets(matchId: string) {
    this.bettingService.currentBets(matchId).subscribe((response: any) => {
      if(response.success){
        this.matchedBets = response?.data?.matched;
        this.unmatchedBets = response?.data?.unmatched;
      }
    })
  }

  subscribeLiveUpdate(matchId: string) {
    let payload = {
      params: "matchData",
      _token: this.userService.token,
      status: true,
      matchId
    }
    this.socketService.sendMessage(payload);
    this.socketService.receiveMessage('matchData').subscribe((response: any) => {
      if (response?.status && response?.data?.matchId == this.matchDetails.matchId) {
        switch (response?.data.type) {
          case 'match-odds':
            this.matchOdds = response.data?.odds;
            break;
          case 'bets':
            this.updateBets(response.data?.bet);
            break;
          case 'bookmaker-odds':
            this.bookmakerOdds = response.data?.odds;
            this.bookmakerOddsList = Object.values(
              response.data?.odds.reduce((acc: any, item: any) => {
                  if (!acc[item.t]) {
                      acc[item.t] = { title: item.t, eventList: [] };
                  }
                  acc[item.t].eventList.push(item);
                  return acc;
              }, {})
            );            
            break;
          case 'fancy-odds':
            this.fancyOdds = response.data?.odds?.sort((a : any, b : any) => a?.srno - b?.srno);
            break;

        }
      }

    })
  }

  updateBets(bet : any) {

    if(bet.status == 'pending'){
      let betExist = this.unmatchedBets.find((b: any) => b._id == bet._id);
      if(!betExist){
        this.unmatchedBets.push(bet);
      }
    }
    else if(bet.status == 'matched') {
      let pbetIndex = this.unmatchedBets.findIndex((b: any) => b._id === bet._id);
      if(pbetIndex != -1){
        this.unmatchedBets.splice(pbetIndex, 1);
      }

      let mbetIndex = this.matchedBets.findIndex((b: any) => b._id === bet._id);
      if(mbetIndex == -1){
        this.matchedBets.push(bet);
      }
    }
    else if(bet.status == 'canceled'){
      let pbetIndex = this.unmatchedBets.findIndex((b: any) => b._id === bet._id);
      if(pbetIndex != -1){
        this.unmatchedBets.splice(pbetIndex, 1);
      }
    }

  }

  ngOnDestroy(): void {
    this.upsubscribeCurrentEvent();
  }

  upsubscribeCurrentEvent() {
    let payload = {
      params: "matchData",
      _token: this.userService.token,
      status: false,
      matchId: this.matchDetails?.matchId
    }
    this.socketService.sendMessage(payload)
    console.log("Unsubscribed!");
  }

  makeBet(runner: any, odd: any, type: 'back' | 'lay', marketType: 1 | 2 | 3) {
    this.bookmakerVisible = false;
  this.selectedId = runner.mid
    this.selectionId = runner.selectionId
    if(marketType !== 1 && !odd?.odds)
      return;

    this.selectedRunner = {
      name: runner.name,
      selectionId: String(runner.selectionId),
      marketId : runner.mid,
    }

    this.betForm.patchValue({
      odds: (marketType !== 3 ? Math.max(1.01, odd.odds) : runner.selectionId),
      stake: 100,
      marketType : marketType,
      fancyOdd : (marketType == 3 ? odd.odds : 0)
    }, { emitEvent: false });

    this.setBetType(type);
    this.betInputVisible = true;
    const control = this.betForm.get('odds');

    if(marketType === 1) {
      control?.enable();
    }
    else {
      control?.disable();
    }
    this.betForm.value.marketType == 1

  }

  makeBookMakerBet(runner: any, odd: any, type: 'back' | 'lay', marketType: 1 | 2 | 3) {
    if(odd?.odds ==0) return;
    this.bookmakerVisible = true;
    this.selectionId = runner.selectionId
      if(marketType !== 1 && !odd?.odds)
        return;

      this.selectedRunner = {
        name: runner.name,
        selectionId: String(runner.selectionId),
        marketId : runner.mid,
      }

      this.betForm.patchValue({
        odds: (marketType !== 3 ? Math.max(1.01, odd.odds) : runner.selectionId),
        stake: 100,
        marketType : marketType,
        fancyOdd : (marketType == 3 ? odd.odds : 0)
      }, { emitEvent: false });

      this.setBetType(type);
      this.betInputVisible = true;
      const control = this.betForm.get('odds');

      if(marketType === 1) {
        control?.enable();
      }
      else {
        control?.disable();
      }

    }

  // Switch Between Back & Lay Bet
  setBetType(type: 'back' | 'lay') {
    this.betType = type;
    this.calculateProfitAndLiability();
  }

  // Increase/Decrease Odds
  adjustOdds(increment: boolean) {
    if(this.isMarketOdds()) {
      const formValues = this.betForm.getRawValue();
      let odds = formValues.odds;
      odds = increment ? odds + 0.01 : odds - 0.01;
      this.betForm.patchValue({ odds: Math.max(1.01, odds) }); // Min odds 1.01
    }
  }

  // Set Stake Amount
  setStake(amount: number) {
    this.betForm.patchValue({ stake: amount });
  }

  // Calculate Profit & Liability for Both Back and Lay Bets
  calculateProfitAndLiability() {
    const formValues = this.betForm.getRawValue();
    const odds = formValues.odds;
    const stake = formValues.stake;

    let profit = 0;
    let liability = 0;

    if(formValues.marketType == 1) {
      if (this.betType === 'back') {
        profit = (odds * stake) - stake;
        liability = stake;
      } else if (this.betType === 'lay') {
        profit = stake;
        liability = (odds - 1) * stake;
      }
    }
    else if(formValues.marketType == 2) {
      if (this.betType === 'back') {
        profit = (odds * stake) / 100;
        liability = stake;
      } else if (this.betType === 'lay') {
        profit = stake;
        liability = (odds * stake) / 100;
      }
    }
    else if(formValues.marketType == 3) {
      const fancyOdd = formValues.fancyOdd;
      profit = 0;
      if (this.betType === 'back') {
        liability = stake;
      }
      else {
        liability = (fancyOdd * stake) / 100;
      }
    }


    // ✅ Ensure values are always numbers before calling `.toFixed(2)`
    profit = isNaN(profit) ? 0 : parseFloat(profit.toFixed(2));
    liability = isNaN(liability) ? 0 : parseFloat(liability.toFixed(2));

    this.betForm.patchValue({ profit, liability }, { emitEvent: false });
  }

  // Clear All Inputs
  clearBetInput() {
    this.betForm.reset({ odds: 1.01, stake: 0, profit: 0, liability: 0 });
    this.betInputVisible = false;
    this.bookmakerVisible = false;
  }

  // Submit Bet
  placeBet() {
    if (this.betForm.valid) {
      let payload : any = {
        matchId : this.matchDetails.matchId,
        marketId : this.selectedRunner.marketId,
        selectionId : this.selectedRunner.selectionId,
        type : this.betType,
        odds : this.betForm.getRawValue()[this.betForm.value.marketType === 3 ? 'fancyOdd' : 'odds'],
        stake : this.betForm.value.stake,
        marketType : this.betForm.value.marketType
      }

      this.bettingService.placeBet(payload).subscribe((response : any) => {
        if(response.success){
          this.userService.showSuccess(response.message);
          this.clearBetInput();
        }
        else {
          this.userService.showError(response.message)
        }
      })
    }
  }

    // Cancel Bet
  cancelBet(betId : string) {
    this.bettingService.cancelBet(betId).subscribe((res: any) => {
      if(res.success){
        this.userService.showSuccess(res.message);
      }
      else {
        this.userService.showError(res.message);
      }
    })

  }

  selectionIdName(bet: any) {
    if(bet.marketType == 1){
      let match = this.matchOdds.find((r: any) => r.marketId == bet.marketId);
      if(match){
        let runner = match?.runners?.find((r : any) => r.selectionId == bet.selectionId);
        if(runner)
          return runner?.name;
      }
    }
    else if(bet.marketType == 2) {
      let selection = this.bookmakerOdds?.find((r: any) => r.sid == bet.selectionId);
      if(selection){
        return `${selection.nation}`;
      }
    }
    return bet.selectionId;

  }

  selectionMarketName(bet: any) {
    if(bet.marketType == 1){
      return 'Match odds'
    }
    else if(bet.marketType == 2) {
      let selection = this.bookmakerOdds?.find((r: any) => r.sid == bet.selectionId);
      if(selection){
        return selection.t;
      }
      else 
        return 'Bookmaker'
    }
    else {
      return 'Fancy'
    }
  }

  onIframeLoad() {
    setTimeout(() => {
      this.isLoading = false;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
    console.log(this.isMobile,"jgn");
  }

  private checkScreenSize() {
    let screen = window.innerWidth <= 576;
    if(screen){
      this.isMobile = true
    }
    else{
      this.isMobile = false;
    }
  }

  getExpectedOutcome(oddType : string, marketId : string, selectionId : string) {
    const bets = [...this.matchedBets, ...this.unmatchedBets];
    const filteredBets = bets.filter((bet : any) => bet.marketId === marketId);
    let result = 0;

    filteredBets.forEach(bet => {
      if(oddType == 'match'){
        if(bet.selectionId == selectionId){
          if(bet.type == 'back'){
            result += (bet.odds-1) * bet.initialStake;
          }
          else {
            result -= bet.liability
          }
        }
        else {
          if(bet.type == 'back'){
            result -= bet.initialStake;
          }
          else {
            result += bet.initialStake;
          }
        }
      }
      else {
        if(bet.selectionId == selectionId){
          if(bet.type == 'back'){
            result += (bet.odds * bet.initialStake) / 100;
          }
          else {
            result -= (bet.odds * bet.initialStake) / 100
          }
        }
        else {
          if(bet.type == 'back'){
            result -=  bet.initialStake
          }
          else {
            result += bet.initialStake;
          }
        }
      }
      
    });

    return result.toFixed(0);
  }
  
  
}
