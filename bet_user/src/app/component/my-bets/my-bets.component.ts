import { Component } from '@angular/core';
import { BettingService } from '../../services/betting.service';
import { mkConfig, generateCsv, download } from "export-to-csv";
import Swal from 'sweetalert2';
import { UserServices } from '../../services/user.service';

@Component({
  selector: 'app-my-bets',
  templateUrl: './my-bets.component.html',
  styleUrl: './my-bets.component.scss'
})
export class MyBetsComponent {
  betHistory: any[] = [];
  page: number = 1;
  limit: number = 5;
  totalItems: number = 0;

  // Filter properties
  startDate: string = '';
  endDate: string = '';
  justForToday: boolean = false;
  fromYesterday: boolean = false;
  selectedBetType: string = '';

  constructor(private bettingService: BettingService, private userService: UserServices) { }

  ngOnInit() {
    this.getuserBets(this.buildQueryParams());
  }

  private buildQueryParams(): any {
    let params: any = {
      page: this.page,
      limit: this.limit
    };

    // Include selected bet type if available
    if (this.selectedBetType) {
      params.betType = this.selectedBetType;
    }

    // Apply preset filters if any
    if (this.justForToday) {

      const today = new Date();
      const formattedToday = this.formatDate(today);
      params.startDate = formattedToday;
      params.endDate = formattedToday;

    } else if (this.fromYesterday) {

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const formattedYesterday = this.formatDate(yesterday);
      params.startDate = formattedYesterday;
      params.endDate = formattedYesterday;

    } else {

      // Otherwise, use manually entered dates if available
      if (this.startDate) {
        params.startDate = this.startDate;
      }
      if (this.endDate) {
        params.endDate = this.endDate;
      }
      
    }
    return params;
  }

  /**
   * Format a Date object into a YYYY-MM-DD string.
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    let month: string | number = date.getMonth() + 1;
    let day: string | number = date.getDate();

    if (month < 10) { month = '0' + month; }
    if (day < 10) { day = '0' + day; }

    return `${year}-${month}-${day}`;
  }

  /**
   * Fetch bet history from the API with the given parameters.
   */
  getuserBets(params: any) {
    this.bettingService.getuserBets(params).subscribe((res: any) => {
      if (res.success) {
        this.betHistory = res.data.result;
        this.totalItems = res.data.totalCount;
      }
    });
  }

  /**
   * Called when the pagination control triggers a page change.
   */
  handlePageEvent(page: number) {
    this.page = page;
    this.getuserBets(this.buildQueryParams());
  }

  /**
   * Called when the "Get History" button is clicked.
   */
  onGetHistory() {
    this.page = 1; // reset to first page when filters change
    this.getuserBets(this.buildQueryParams());
  }

  /**
   * Called when the "Clear" button is clicked to remove all filters.
   */
  onClearFilters() {
    this.startDate = '';
    this.endDate = '';
    this.justForToday = false;
    this.fromYesterday = false;
    this.page = 1;
    this.selectedBetType = '';  // Reset bet type filter
    this.getuserBets(this.buildQueryParams());
  }

  /**
   * Optional: If you want to enforce that only one checkbox can be active at a time,
   * you can clear the other checkbox when one changes.
   */
  onTodayCheckboxChange() {
    if (this.justForToday) {
      // Uncheck "From Yesterday" if "Just For Today" is selected
      this.fromYesterday = false;
      // Optionally, clear manual date inputs
      this.startDate = '';
      this.endDate = '';
    }
  }

  onYesterdayCheckboxChange() {
    if (this.fromYesterday) {
      // Uncheck "Just For Today" if "From Yesterday" is selected
      this.justForToday = false;
      // Optionally, clear manual date inputs
      this.startDate = '';
      this.endDate = '';
    }
  }

  exportcsv(){
    Swal.fire({
      title: 'Do you export as csv?',
      iconHtml: '<i class="bi bi-cloud-download-fill"></i>',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: `Yes`,
      denyButtonText: `No`,
    }).then((result) => {
      if (result.isConfirmed) {
        let params: any = {
          page: 1,
          limit: this.totalItems
        };
        this.bettingService.getuserBets(params).subscribe((res: any) => {
          if (res.success) {
            let csvConfig = mkConfig({ useKeysAsHeaders: true, filename : `bet-history-${Date.now()}` });
            const csv = generateCsv(csvConfig)( res.data.result);
            download(csvConfig)(csv)
            this.userService.showSuccess('Exported successfully');
          }

        });
      }
    })
  
  }
}