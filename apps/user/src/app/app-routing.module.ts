import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './common/layout/layout.component';
import { LandingComponent } from './component/landing/landing.component';
import { AccountStatementComponent } from './component/account-statement/account-statement.component';
import { MyBetsComponent } from './component/my-bets/my-bets.component';
import { MatchDetailsComponent } from './component/match-details/match-details.component';
import { FancybetsComponent } from './component/fancybets/fancybets.component';
import { ExchangegamebetsComponent } from './component/exchangegamebets/exchangegamebets.component';
import { CasinobetsComponent } from './component/casinobets/casinobets.component';
import { BetgamebettinghistoryComponent } from './component/betgamebettinghistory/betgamebettinghistory.component';
import { AwcbetsComponent } from './component/awcbets/awcbets.component';
import { ProfitlossComponent } from './component/profitloss/profitloss.component';
import { StakeComponent } from './component/stake/stake.component';
import { ActivitylogsComponent } from './component/activitylogs/activitylogs.component';
import { InplayMatchesComponent } from './component/inplay-matches/inplay-matches.component';
import { AwcListComponent } from './component/awc-list/awc-list.component';
import { LoginComponent } from './component/login/login.component';
import { authGuard, checkGuard } from './auth/auth.guard'
import { SupportChatComponent } from './component/support-chat/support-chat.component';
import { TodoListComponent } from './component/todo/todo-list.component';

const routes: Routes = [
  { path: '', component: TodoListComponent },
  // { path: '', redirectTo: "/login", pathMatch: 'full' },
  // { path: 'match-details/:sportId/:matchId', component: MatchDetailsComponent, canActivate: [authGuard] },
  // { path: 'in-play', component: InplayMatchesComponent, canActivate: [authGuard] },
  // { path: 'awc-list', component: AwcListComponent },
  // { path: 'login', component: LoginComponent, canActivate: [checkGuard] },
  // {
  //   path: '', component: LayoutComponent, children: [
  //     { path: 'landing', component: LandingComponent, canActivate: [authGuard] },
  //     { path: 'acc-statement', component: AccountStatementComponent },
  //     { path: 'my-bets', component: MyBetsComponent, canActivate: [authGuard] },
  //     { path: '', component: LandingComponent },
  //     { path: 'fancy-bets', component: FancybetsComponent },
  //     { path: 'exchange-game-bets', component: ExchangegamebetsComponent, canActivate: [authGuard] },
  //     { path: 'casino-bets', component: CasinobetsComponent },
  //     { path: 'betgame-bettinghistory', component: BetgamebettinghistoryComponent, canActivate: [authGuard] },
  //     { path: 'awc-bets', component: AwcbetsComponent },
  //     { path: 'profit-loss', component: ProfitlossComponent },
  //     { path: 'stake', component: StakeComponent },
  //     { path: 'activites', component: ActivitylogsComponent },
  //     { path: 'support-chat', component: SupportChatComponent }
  //   ]
  // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
