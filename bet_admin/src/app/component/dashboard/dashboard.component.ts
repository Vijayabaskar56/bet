import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SignalService } from '../../service/signal.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  @ViewChild('passwordchange') passwordDialog: TemplateRef<any> | any;
  receivedSignal: any;
  first_Login: any;
  form: any;
  submitted: boolean = false;
  confirmPassword: any;
  constructor(private signalService : SignalService,private dialog : MatDialog){}
  ngOnInit(){
    this.form = new FormGroup({
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required)
    });
  }

  ngAfterViewInit(){
    this.receivedSignal = this.signalService.subscribeEvent();  
      if(this.receivedSignal()?.EventName == 'firstLogin'){
        this.first_Login = this.receivedSignal().EventDetails;
        console.log(this.first_Login,"first_Login");
        if(this.first_Login === 1){
          console.log(this.first_Login,"this.receivedSignal().EventName");
          this.openDialog(this.passwordDialog)
        }
      }
  }
  submit(){
    this.submitted = true
    if(this.form.valid){
      console.log(this.form.value);
    }
  }

  openDialog(template: TemplateRef<any>){
    this.dialog.open(template,{
      width: "100%",
      height: "auto",
      maxWidth: "25rem",
    disableClose: true
    })
  }

  close(){
    this.dialog.closeAll()
  }
}
