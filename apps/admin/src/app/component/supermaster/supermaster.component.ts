import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ButtonComponent } from '../../common/button/button.component';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment.development';
import { AdminServiceService } from '../../service/admin-service.service';
import { MatDialog } from '@angular/material/dialog';
import { ColDef } from 'ag-grid-community';
import { SignalService } from '../../service/signal.service';


@Component({
  selector: 'app-supermaster',
  templateUrl: './supermaster.component.html',
  styleUrl: './supermaster.component.scss'
})
export class SupermasterComponent {
  loginForm!: FormGroup;
  submitted : boolean = false;
  totalCount: any;
  rowData: any;
  gridApi: any;
  paginationPageSizeSelector = [5];
  page: any = {page_no: 1,total_page: "", itemsPerPage: environment.PAGE_SIZE,total_page_dep: "",total_page_withdraw: ""};
  roleStatus : any[] = ['Admins','Sub Admins','Masters','Agents','Users']
  roleDetails: any;

  constructor(private fb : FormBuilder,private callApi : AdminServiceService,private dialog:MatDialog,private signalService : SignalService){}
  ngOnInit(){
    this.form()
    this.subAdminList({role:3},1)
    let roles = 'masters'
    this.signalService.publishEvent({ EventName: 'role', EventDetails: roles });
    this.roleDetails = sessionStorage.getItem('role')
    console.log(this.roleDetails,"this.roleDetails");
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

  submit(){
    this.submitted = true
    console.log(this.loginForm.value);
    
    if(this.loginForm.valid){
      let payload = {
        ...this.loginForm.value,
        "role" : 3
      }
      console.log(payload,"payload");
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
        this.subAdminList({role:3},1)
      }
      else{
        this.callApi.showError(res.message)
      }
      })
    }
  }

  openDialog(template:TemplateRef<any>){
   this.dialog.open(template,{
    width: "100%",
    height: "auto",
    maxWidth: "25rem"
   })
  }

  colDefs: ColDef[] = [
    { headerName: "S.No.", field: "serialNumber"},
    { headerName: "Name", field: "user_name"},
    { headerName: "Email ID", field: "email"},
    { headerName: "Action" , field: "actions", cellRenderer: ButtonComponent}
    // { headerName: "Role", field: "role"}
  ];

  subAdminList(payload:any,page:any){
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
    this.subAdminList({role:3},page)
  }
  searchText = new FormControl('', Validators.required)

  searchFilter(name:any){
    let payload = {
      submaster_name : this.searchText.value,
      role:3
    }
    this.subAdminList(payload,1)
  }

  clear(){
    this.searchText.reset()
    this.subAdminList({role:3},1)
  }

  close(){
    this.dialog.closeAll()
  }

  ngOnDestroy(){
    this.signalService.clearEvent()
  }
}
