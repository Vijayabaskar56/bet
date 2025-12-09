import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './common/layout/layout.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { LoginComponent } from './component/login/login.component';
import { ProfileComponent } from './component/profile/profile.component';
import { ParlaybetlistComponent } from './component/parlaybetlist/parlaybetlist.component';
import { ParlayDownlineComponent } from './component/report/parlay-downline/parlay-downline.component';
import { PlAuracasinoComponent } from './component/report/pl-auracasino/pl-auracasino.component';
import { PlAwccasinoComponent } from './component/report/pl-awccasino/pl-awccasino.component';
import { PlBetgamesComponent } from './component/report/pl-betgames/pl-betgames.component';
import { PlDiacasinoComponent } from './component/report/pl-diacasino/pl-diacasino.component';
import { PlDownlineComponent } from './component/report/pl-downline/pl-downline.component';
import { PlMarketComponent } from './component/report/pl-market/pl-market.component';
import { PlPlayerComponent } from './component/report/pl-player/pl-player.component';
import { PnlCasinoDownlineComponent } from './component/report/pnl-casino-downline/pnl-casino-downline.component';
import { PnlDownlineComponent } from './component/report/pnl-downline/pnl-downline.component';
import { PnlMatchComponent } from './component/report/pnl-match/pnl-match.component';
import { RiskManagementComponent } from './component/risk-management/risk-management.component';
import { AlluserListComponent } from './component/alluser-list/alluser-list.component';
import { AlluserComponent } from './component/alluser/alluser.component';
import { AwcCasinoComponent } from './component/awc-casino/awc-casino.component';
import { BankingComponent } from './component/banking/banking.component';
import { BankinglogComponent } from './component/bankinglog/bankinglog.component';
import { BetGamesComponent } from './component/bet-games/bet-games.component';
import { BetListComponent } from './component/bet-list/bet-list.component';
import { BetLiveListComponent } from './component/bet-live-list/bet-live-list.component';
import { BlockMarketComponent } from './component/block-market/block-market.component';
import { AddsubadminComponent } from './component/addsubadmin/addsubadmin.component';
import { AdminlistComponent } from './component/adminlist/adminlist.component';
import { AllagentsComponent } from './component/allagents/allagents.component';
import { MastersComponent } from './component/masters/masters.component';
import { UserComponent } from './component/user/user.component';
import { ListingComponent } from './common/listing/listing.component';
import { authGuard } from './authguard/auth.guard';
import { ErrorComponent } from './common/error/error.component';
import { SupportchatComponent } from './component/supportchat/supportchat.component';
import { ChatlistComponent } from './component/chatlist/chatlist.component';
import { TodosComponent } from './test/test.component';
import { TransactionhistoryComponent } from './component/transactionhistory/transactionhistory.component';
import { SupermasterComponent } from './component/supermaster/supermaster.component';
import { UserEngagementComponent } from './component/user-engagement/user-engagement.component';
import { UserBetHistoryComponent } from './common/user-bet-history/user-bet-history.component';
import { LimitsettingsComponent } from './component/limitsettings/limitsettings.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: '', component: LayoutComponent, children: [
      {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
      {path: 'profile', component: ProfileComponent,canActivate: [authGuard]},
      { path: 'block-market', component: BlockMarketComponent,canActivate: [authGuard] },
      { path: 'alluserList', component: AlluserComponent,canActivate: [authGuard] },
      { path: 'bet-live-list', component: BetLiveListComponent,canActivate: [authGuard]},
      { path: 'awc-casino', component: AwcCasinoComponent,canActivate: [authGuard]},
      { path: 'bet-games', component: BetGamesComponent,canActivate: [authGuard]},
      { path: 'bet-list', component: BetListComponent,canActivate: [authGuard]},
      { path: 'user-bet-history',component: UserBetHistoryComponent, canActivate: [authGuard]},
      { path: 'banking', component: BankingComponent,canActivate: [authGuard]},
      { path: 'parlaybetlist', component: ParlaybetlistComponent,canActivate: [authGuard]},
      { path: 'bankinglog', component: BankinglogComponent,canActivate: [authGuard]},
      { path: 'risk-management', component: RiskManagementComponent,canActivate: [authGuard]},
      { path: 'report/pl-downline', component: PlDownlineComponent,canActivate: [authGuard]},
      { path: 'report/parlay-Downline', component: ParlayDownlineComponent,canActivate: [authGuard]},
      { path: 'report/pl-market', component: PlMarketComponent,canActivate: [authGuard]},
      { path: 'report/pnl-match', component: PnlMatchComponent,canActivate: [authGuard]},
      { path: 'report/pl-player', component: PlPlayerComponent,canActivate: [authGuard]},
      { path: 'report/pnl-casino-downline', component: PnlCasinoDownlineComponent,canActivate: [authGuard]},
      { path: 'report/pnl-downline', component: PnlDownlineComponent,canActivate: [authGuard]},
      { path: 'report/pl-diacasino', component: PlDiacasinoComponent,canActivate: [authGuard]},
      { path: 'report/pl-betgames', component: PlBetgamesComponent,canActivate: [authGuard]},
      { path: 'report/pl-auracasino', component: PlAuracasinoComponent,canActivate: [authGuard] },
      { path: 'report/pl-awccasino', component: PlAwccasinoComponent,canActivate: [authGuard] },
      { path: 'subadminlist', component: AddsubadminComponent,canActivate: [authGuard]},
      { path: 'adminlist', component: AdminlistComponent,canActivate: [authGuard]},
      { path: 'allagents', component: AllagentsComponent,canActivate: [authGuard]},
      { path: 'masters',component: MastersComponent,canActivate: [authGuard]},
      { path: 'viewlisting', component: ListingComponent,canActivate: [authGuard]},
      { path: 'chatlist', component: ChatlistComponent, canActivate: [authGuard]},
      { path: 'supportChat', component: SupportchatComponent,canActivate: [authGuard]},
      { path: 'transactionHistory', component: TransactionhistoryComponent,canActivate: [authGuard]},
      { path: 'supermaster', component: SupermasterComponent , canActivate: [authGuard]},
      { path: 'bet-limited', component: UserEngagementComponent , canActivate: [authGuard]},
      { path: 'limitSettings', component: LimitsettingsComponent , canActivate: [authGuard]}

    ]},

    { path: '**', component: ErrorComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
