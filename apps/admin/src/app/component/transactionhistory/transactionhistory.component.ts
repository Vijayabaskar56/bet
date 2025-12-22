import { Component } from '@angular/core';
import { ButtonComponent } from '../../common/button/button.component';
import { SignalService } from '../../service/signal.service';
import { AdminServiceService } from '../../service/admin-service.service';
import { environment } from '../../../environments/environment.development';
import { ColDef } from 'ag-grid-community';
import { FormControl, Validators } from '@angular/forms';


@Component({
  selector: 'app-transactionhistory',
  templateUrl: './transactionhistory.component.html',
  styleUrl: './transactionhistory.component.scss'
})
export class TransactionhistoryComponent {
  page: any = {page_no: 1,total_page: "", itemsPerPage: environment.PAGE_SIZE,total_page_dep: "",total_page_withdraw: ""};
  gridApi: any;
  rowData: any;

  constructor(private callApi : AdminServiceService,private signalService : SignalService){}

  ngOnInit(){
    this.adminList(1)
    let roles = 'subadmins'
    this.signalService.publishEvent({ EventName: 'role', EventDetails: roles });
  }

  colDefs: ColDef[] = [
    { headerName: "S.No.", field: "serialNumber"},
    { headerName: "Sender", field: "sender_name"},
    { headerName: "Receiver", field: "receiver_name"},
    { headerName: "Type", field: "type",
    valueGetter: (params) =>{
      if(params.data.type === 1){
        return 'deposit'
      }
      else{
        return 'withdraw'
      }
    }
  },
    { headerName: "Transaction" , field: "lineType",
    cellRenderer: (params: any) => {
      if (params.value === 1) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up text-success" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"/>
      </svg>`;
      } else {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down text-danger" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"/>
      </svg>`;
      }
    }
  },
    { headerName: "Amount send", field: "withdraw_by_downline"},
    { headerName: "Amount received" , field: "withdraw_from_upline"}
  ];

  adminList(page:any){
    const itemsPerPage = this.page.itemsPerPage;  
    const currentPage = this.page.page_no;
    this.callApi.transactionHistory(page).subscribe((res:any)=>{
      this.rowData = res?.data?.pagedData.map((item:any,index:any) =>{
        const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return {
          ...item,
        serialNumber: serialNumber
        }
      })
      this.page.total_page = res?.data?.totalCount
      
    })
  }

  onGridReady(params:any){
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  handlePagination(page:any){
    this.page.page_no = page
    this.adminList(page)
  }

  searchText = new FormControl('', Validators.required)

  searchFilter(name:any){
    let payload = {
      admin_name : this.searchText.value,
      role: 1
    }
    this.adminList(1)
  }

  clear(){
    this.searchText.reset()
    this.adminList(1)
  }

  ngOnDestroy(){
    // this.signalService.clearEvent()
  }
}
