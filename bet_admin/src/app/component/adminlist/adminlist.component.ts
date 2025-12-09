import { Component } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { environment } from '../../../environments/environment.development';
import { FormControl, Validators } from '@angular/forms';
import { ButtonComponent } from '../../common/button/button.component';
import { SignalService } from '../../service/signal.service';
import { AdminServiceService } from '../../service/admin-service.service';

@Component({
  selector: 'app-adminlist',
  templateUrl: './adminlist.component.html',
  styleUrl: './adminlist.component.scss'
})
export class AdminlistComponent {
  page: any = {page_no: 1,total_page: "", itemsPerPage: environment.PAGE_SIZE,total_page_dep: "",total_page_withdraw: ""};
  gridApi: any;
  rowData: any;

  constructor(private callApi : AdminServiceService,private signalService : SignalService){}

  ngOnInit(){
    this.adminList({role:1},1)
    let roles = 'subadmins'
    this.signalService.publishEvent({ EventName: 'role', EventDetails: roles });
  }

  colDefs: ColDef[] = [
    { headerName: "S.No.", field: "serialNumber"},
    { headerName: "Name", field: "name"},
    { headerName: "Email ID", field: "email_id"},
    { headerName: "Action" , field: "actions", cellRenderer: ButtonComponent}
    // { headerName: "Role", field: "role"}
  ];

  adminList(payload:any,page:any){
    const itemsPerPage = this.page.itemsPerPage;  
    const currentPage = this.page.page_no;
    this.callApi.getAdminList(payload,page).subscribe((res:any)=>{
      if(res.data.totalCount > 0){
        this.rowData = res?.data?.data.map((item:any,index:any) =>{
          const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
          return {
            ...item,
          serialNumber: serialNumber
          }
        })
        this.page.total_page = res?.data?.totalCount
      }
      else{
        this.rowData = res?.message
      }
      
    })
  }

  onGridReady(params:any){
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  handlePagination(page:any){
    this.page.page_no = page
    this.adminList({role:1},page)
  }

  searchText = new FormControl('', Validators.required)

  searchFilter(name:any){
    let payload = {
      admin_name : this.searchText.value,
      role: 1
    }
    this.adminList(payload,1)
  }

  clear(){
    this.searchText.reset()
    this.adminList({role:1},1)
  }

  ngOnDestroy(){
    // this.signalService.clearEvent()
  }
 
}
