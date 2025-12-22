import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ChatbuttonComponent } from '../../common/chatbutton/chatbutton.component';
import { AdminServiceService } from '../../service/admin-service.service';
import { environment } from '../../../environments/environment.development';
import { ColDef } from 'ag-grid-community';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-chatlist',
  templateUrl: './chatlist.component.html',
  styleUrl: './chatlist.component.scss'
})
export class ChatlistComponent {
  page: any = {page_no: 1,total_page: "", itemsPerPage: environment.PAGE_SIZE,total_page_dep: "",total_page_withdraw: ""};
  gridApi: any;
  rowData: any;

  constructor(private callApi : AdminServiceService){}

  ngOnInit(){
    this.chatList(1,'')
  }

  colDefs: ColDef[] = [
    { headerName: "S.No.", field: "serialNumber"},
    { headerName: 'Created', field: "createdAt", valueGetter: (params) =>{
      return new DatePipe('en-US').transform(params.data.createdAt, 'short')
    }},
    { headerName: "Email ID", field: "user_name", valueGetter: (params) => {
      return params.data.user_name || params.data.name || '';
    }
  },
    { headerName: "Email ID", field: "email", valueGetter: (params) => {
      return params.data.email_id || params.data.email || '';
    },
},
    { headerName: "Action", field: "actions", cellRenderer: ChatbuttonComponent}
  ];

  chatList(page:any, user_name:any){
    const itemsPerPage = this.page.itemsPerPage;      
    const currentPage = this.page.page_no;
    this.callApi.chatListing(page,null).subscribe((res:any)=>{
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
    this.chatList(page, '')
  }

  searchText = new FormControl('', Validators.required)

  searchFilter(name:any){
    console.log(this.searchText.value,"this.searchText.value")
    let payload = {
      user_name : this.searchText.value,
    }
    this.chatList(1,payload)
  }

  clear(){
    this.searchText.reset()
    this.chatList(1,'')
  }
}
