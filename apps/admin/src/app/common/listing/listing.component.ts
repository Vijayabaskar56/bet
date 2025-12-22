import { Component } from '@angular/core';
import { GridApi } from 'ag-grid-community';
import { Observable, of } from 'rxjs';
import { ColDef } from 'ag-grid-community';
import { environment } from '../../../environments/environment.development';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminServiceService } from '../../service/admin-service.service';

@Component({
  selector: 'app-listing',
  templateUrl: './listing.component.html',
  styleUrl: './listing.component.scss'
})
export class ListingComponent {
  page: any = {page_no: 1,total_page: "", itemsPerPage: environment.PAGE_SIZE,total_page_dep: "",total_page_withdraw: ""};
  gridApi: any;
  rowData: any;
  payload: any;
  roles: any[] = ['', 'Admin','Subadmin', 'Master', 'Agent', 'User']

  constructor(private callApi : AdminServiceService,private route: ActivatedRoute){}

  ngOnInit(){
    this.route.queryParams.subscribe(async (res:any)=>{
      if(res?.role == 1){
      return  this.payload = {
        admin_id : res?.id,
        role : 1
       }
      }
      else if(res?.role == 2){
      return  this.payload = {
          subadmin_id : res?.id,
          role : 2
         }
      }
      else if(res?.role == 3){
      return  this.payload = {
        submaster_id : res?.id,
          role : 3
         }
      }
      else if(res?.role == 4){
      return  this.payload = {
        master : res?.id,
          role : 4
         }
      }
      else if(res?.role == 5){
        return  this.payload = {
          agent : res?.id,
            role : 5
           }
      }
      else{
        return  this.payload = {
          user : res?.id,
            role : 6
           }
      }
    })
    this.commonList(this.payload,1)
  }

  colDefs: ColDef[] = [
    { headerName: "S.No.", field: "serialNumber"},
    { headerName: "Username", field: "user_name"},
    { headerName: "Email ID", field: "email", valueGetter: (params) => {
      return params.data.email_id || params.data.email || '';
    },
},
  ];

  commonList(payload:any,page:any){
    const itemsPerPage = this.page.itemsPerPage;  
    const currentPage = this.page.page_no;
    this.callApi.getAdminList(payload,page).subscribe((res:any)=>{
      this.rowData = res?.data.data.map((item:any,index:any) =>{
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
    this.commonList({role:this.payload?.role},page)
  }

  searchText = new FormControl('', Validators.required)

  searchFilter(name:any){
    // let payload = {
    //   agent_name : this.searchText.value,
    //   role: 4
    // }
    // this.commonList(payload,1)
  }

  clear(){
    this.searchText.reset()
    this.commonList({role:this.payload?.role},1)
  }
}
