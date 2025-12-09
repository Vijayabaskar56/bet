import { Component, TemplateRef } from '@angular/core';
import { GridApi } from 'ag-grid-community';
import { Observable, of } from 'rxjs';
import { ColDef } from 'ag-grid-community';
import { environment } from '../../../environments/environment.development';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ButtonComponent } from '../../common/button/button.component';
import { SignalService } from '../../service/signal.service';
import { AdminServiceService } from '../../service/admin-service.service';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-allagents',
  templateUrl: './allagents.component.html',
  styleUrl: './allagents.component.scss'
})
export class AllagentsComponent {
  page: any = {page_no: 1,total_page: "", itemsPerPage: environment.PAGE_SIZE,total_page_dep: "",total_page_withdraw: ""};
  gridApi: any;
  rowData: any;
  loginForm!: FormGroup;
  submitted: boolean = false;
  role: any;

  constructor(private callApi : AdminServiceService,private signalService : SignalService,private dialog :MatDialog,private fb :FormBuilder){
    this.role = sessionStorage.getItem('role')
  }

  ngOnInit(){
    this.agentList({role:5},1)
    let roles = 'users'
    this.signalService.publishEvent({ EventName: 'role', EventDetails: roles });
    this.form()
  }

  colDefs: ColDef[] = [
    { headerName: "S.No.", field: "serialNumber"},
    { headerName: "Name", field: "user_name"},
    { headerName: "Email ID", field: "email"},
    { headerName: "Action" , field: "actions", cellRenderer: ButtonComponent}
    // { headerName: "Role", field: "role"}
  ];

  agentList(payload:any,page:any){
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
    this.agentList({role:5},page)
  }

  searchText = new FormControl('', Validators.required)

  searchFilter(name:any){
    let payload = {
      agent_name : this.searchText.value,
      role: 4
    }
    this.agentList(payload,1)
  }

  clear(){
    this.searchText.reset()
    this.agentList({role:5},1)
  }

  ngOnDestroy(){
    this.signalService.clearEvent()
    // this.form()
  }

  form(){
    let emailregex: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    this.loginForm = this.fb.group({
      user_name : [null,[Validators.required]],
      email : [null,[Validators.required,Validators.pattern(emailregex)]],
      password : [null,[Validators.required]]
    })
  }
  // get f() { return this.form.controls; }
  get f() {return this.loginForm.controls;}

  openDialog(template:TemplateRef<any>){
    this.dialog.open(template,{
     width: "100%",
     height: "auto",
     maxWidth: "25rem"
    })
   }

   submit(){
    console.log(this.loginForm.value);
    
    this.submitted = true
    if(this.loginForm.valid){
      let payload = {
        ...this.loginForm.value,
        "role":5
      }
      this.callApi.createMaster(payload).subscribe((res:any) =>{
      if(res.success){
        this.callApi.showSuccess(res.message)
        this.dialog.closeAll()
        Swal.fire({
          animation : false,
          title : (res.message),
          icon: "success",
          showConfirmButton: false,
          timer: 1500
        })
        this.agentList({role:5},1)
      }
      else{
        this.callApi.showError(res.message)
      }
      })
    }
  }

  close(){
    this.dialog.closeAll()
  }
  
}
