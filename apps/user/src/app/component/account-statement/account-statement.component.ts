import { Component, inject } from '@angular/core';
import Swal from 'sweetalert2';
import { mkConfig, generateCsv, download } from "export-to-csv";
import { UserServices } from '../../services/user.service';

@Component({
  selector: 'app-account-statement',
  templateUrl: './account-statement.component.html',
  styleUrl: './account-statement.component.scss'
})
export class AccountStatementComponent {
  userApiService = inject(UserServices);
  history : any[] = [];
  page: number = 1;
  limit: number = 5;
  totalItems: number = 0;
  
  // Filter properties
  startDate: string = '';
  endDate: string = '';
  justForToday: boolean = false;
  fromYesterday: boolean = false;
  selectedBetType: string = '';

  ngOnInit() {
    this.getTransactionHistory();
  }

  

  getTransactionHistory() {
    this.userApiService.getTransactionHistory(this.buildQueryParams()).subscribe((response : any) => {
      if(response.success){
        this.history = response?.data?.pagedData;
        this.totalItems = response.data.totalCount;
      }
    })
  }

  private buildQueryParams(): any {
    let params: any = {
      page: this.page,
      limit: this.limit
    };
    return params;
  }
  
  handlePageEvent(page: number) {
    this.page = page;
    this.getTransactionHistory();
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
        this.userApiService.getTransactionHistory(params).subscribe((res: any) => {
          if (res.success) {
            let csvConfig = mkConfig({ useKeysAsHeaders: true, filename : `transaction-history-${Date.now()}` });
            const csv = generateCsv(csvConfig)( res.data.pagedData);
            download(csvConfig)(csv)
            this.userApiService.showSuccess('Exported successfully');
          }

        });
      }
    })
  
  }
}
