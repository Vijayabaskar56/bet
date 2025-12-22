import { Component, TemplateRef, computed } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SignalService } from '../../service/signal.service';
import { AdminServiceService } from '../../service/admin-service.service';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  params!: ICellRendererParams;
  message : any;
  receivedSignal: any;
  admin: boolean = false;
  submitted: boolean = false;
  role: any;
  
  constructor(private callApi: AdminServiceService, private dialog : MatDialog, private router : Router, private signalService : SignalService) { }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    
    if(this.params.data.role == 1){
      this.admin =true
    }
  }

  ngOnInit(){
    this.receivedSignal = this.signalService.subscribeEvent();
    if(this.receivedSignal().EventName == 'role'){
      this.message = this.receivedSignal().EventDetails;
      console.log(this.message);
      
      if(this.message == "subadmins"){
        this.role = 2
      }
      else if(this.message == "masters"){
        this.role = 3
      }
      else if(this.message == "supermasters"){
        this.role = 4
      }
      else if(this.message == "agents"){
        this.role = 5
      }
      else{
        this.role = 6
      }
    }
  }

  view(): void {
    const id = this.params?.data._id;
    console.log(this.params?.data?.role,"this.params?.data?.role");
    
    this.router.navigate(['viewlisting'] ,{ queryParams: {id : id, role : this.role}})
  }

  ngOnDestroy(){
    this.callApi.clearEvent()
  }

  addBal(template:TemplateRef<any>){
    this.dialog.open(template,{
      width: '100%',
      maxWidth: '25rem',
      height: 'auto'
    })
  }

  amt = new FormControl('', Validators.required)

  submit(){
    this.submitted = true
    if(this.amt.valid){
      let payload = {
        "admin_amt": Number(this.amt.value)
      }
      this.callApi.addAdminBalance(payload).subscribe((res:any) =>{
        if(res.success){
          this.callApi.showSuccess(res.message)
          this.dialog.closeAll()
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
