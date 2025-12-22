import { Component } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { ColDef } from 'ag-grid-community';
import { FormControl, Validators } from '@angular/forms';
import { AdminServiceService } from '../../service/admin-service.service';
@Component({
  selector: 'app-alluser',
  templateUrl: './alluser.component.html',
  styleUrl: './alluser.component.scss'
})
export class AlluserComponent {
  page: any = {page_no: 1,total_page: "", itemsPerPage: environment.PAGE_SIZE,total_page_dep: "",total_page_withdraw: ""};
  gridApi: any;
  rowData: any;

  constructor(private callApi : AdminServiceService){}

  ngOnInit(){
    this.UserList({role:5},1)
  }

  colDefs: ColDef[] = [
    { headerName: "S.No.", field: "serialNumber"},
    { headerName: "Name", field: "user_name"},
    { headerName: "Email ID", field: "email"},
    // { headerName: "Created By", field: "creatorDetails.user_name"},
  ];

  UserList(payload:any,page:any){
    const itemsPerPage = this.page.itemsPerPage;      
    const currentPage = this.page.page_no;
    this.callApi.getAdminList(payload,page).subscribe((res:any)=>{
      this.rowData = res?.data?.data.map((item:any,index:any) =>{
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
    this.UserList({role:5},page)
  }

  searchText = new FormControl('', Validators.required)

  searchFilter(name:any){
    let payload = {
      user_name : this.searchText.value,
      role: 5
    }
    this.UserList(payload,1)
  }

  clear(){
    this.searchText.reset()
    this.UserList({role:5},1)
  }
}
