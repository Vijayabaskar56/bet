import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './common/layout/layout.component';
import { HeaderComponent } from './common/header/header.component';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { FooterComponent } from './common/footer/footer.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { ProfileComponent } from './component/profile/profile.component';
import { LoginComponent } from './component/login/login.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { AddsubadminComponent } from './component/addsubadmin/addsubadmin.component';
import { AdminlistComponent } from './component/adminlist/adminlist.component';
import { AgGridAngular } from 'ag-grid-angular';
import { AllagentsComponent } from './component/allagents/allagents.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { MastersComponent } from './component/masters/masters.component';
import { MatIconModule } from '@angular/material/icon';
import { UserComponent } from './component/user/user.component';
import { AlluserComponent } from './component/alluser/alluser.component';
import { ButtonComponent } from './common/button/button.component';
import { ListingComponent } from './common/listing/listing.component';
import { BreadcrumbComponent } from './common/breadcrumb/breadcrumb.component';
import { ErrorComponent } from './common/error/error.component';
import { SupportchatComponent } from './component/supportchat/supportchat.component';
import { ChatbuttonComponent } from './common/chatbutton/chatbutton.component';
import { ChatlistComponent } from './component/chatlist/chatlist.component';
import { TodosComponent } from './test/test.component';
import { provideHttpClient } from '@angular/common/http'
// import {MatPaginatorModule} from '@angular/material/paginator';
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { BankingComponent } from './component/banking/banking.component';
import { TransactionhistoryComponent } from './component/transactionhistory/transactionhistory.component';
import { SupermasterComponent } from './component/supermaster/supermaster.component';
import { CommonModule } from '@angular/common';
import { UserEngagementComponent } from './component/user-engagement/user-engagement.component';
import { MatDialogModule } from '@angular/material/dialog';
import { UserBetHistoryComponent } from './common/user-bet-history/user-bet-history.component';
import { LimitsettingsComponent } from './component/limitsettings/limitsettings.component';
import { BlockMarketComponent } from './component/block-market/block-market.component';
import { apiHandlerInterceptor } from './interceptors/api-handler.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    DashboardComponent,
    ProfileComponent,
    LoginComponent,
    AddsubadminComponent,
    AdminlistComponent,
    AllagentsComponent,
    MastersComponent,
    UserComponent,
    AlluserComponent,
    ButtonComponent,
    ListingComponent,
    BreadcrumbComponent,
    ErrorComponent,
    SupportchatComponent,
    ChatbuttonComponent,
    ChatlistComponent,
    TodosComponent,
    BankingComponent,
    TransactionhistoryComponent,
    SupermasterComponent,
    UserEngagementComponent,
    UserBetHistoryComponent,
    LimitsettingsComponent,
    BlockMarketComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot({
      timeOut: 2000
    }),
    AgGridAngular,
    NgxPaginationModule,
    MatIconModule,
    CommonModule,
    MatDialogModule
    // MatPaginatorModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: apiHandlerInterceptor,
      multi: true  // Important: ensures multiple interceptors can be used
    },
    provideAnimationsAsync(),
    provideHttpClient(), provideTanStackQuery(new QueryClient())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
