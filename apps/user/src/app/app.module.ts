import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingComponent } from './component/landing/landing.component';
import { LayoutComponent } from './common/layout/layout.component';
import { HeaderComponent } from './common/header/header.component';
import { FooterComponent } from './common/footer/footer.component';
import { SidebarComponent } from './common/sidebar/sidebar.component';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule, provideToastr } from 'ngx-toastr';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NgxPaginationModule } from 'ngx-pagination';
import { SupportChatComponent } from './component/support-chat/support-chat.component'
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { FilterPipe } from './pipe/filter.pipe';
import { apiHandlerInterceptor } from './interceptors/api-handler.interceptor';
import { CustomDatePipe } from './pipe/custom-date.pipe';
import { SortPipe } from './pipe/sort.pipe';
import { NumberSuffixPipe } from './pipe/number-suffix.pipe';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';


@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LayoutComponent,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    AccountStatementComponent,
    MyBetsComponent,
    MatchDetailsComponent,
    FancybetsComponent,
    ExchangegamebetsComponent,
    CasinobetsComponent,
    BetgamebettinghistoryComponent,
    AwcbetsComponent,
    ProfitlossComponent,
    StakeComponent,
    ActivitylogsComponent,
    InplayMatchesComponent,
    AwcListComponent,
    LoginComponent,
    SupportChatComponent,
    FilterPipe,
    CustomDatePipe,
    SortPipe,
    NumberSuffixPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot(),
    NgxPaginationModule,
    MatIconModule,
    MatDialogModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: apiHandlerInterceptor,
      multi: true  // Important: ensures multiple interceptors can be used
    },
    provideToastr({
      timeOut: 2000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    provideAnimationsAsync(),
    provideTanStackQuery(new QueryClient())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
