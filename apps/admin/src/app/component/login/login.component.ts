import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminServiceService } from '../../service/admin-service.service';
import { SignalService } from '../../service/signal.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm!: FormGroup;
  submitted : boolean = false;

  constructor(private fb : FormBuilder,private callApi : AdminServiceService,private router: Router,private signalService : SignalService){}
  ngOnInit(){
    this.form()
  }

  form(){
    let emailregex: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    this.loginForm = this.fb.group({
      email_id : [null,[Validators.required]],
      password : [null,[Validators.required]]
    })
  }
  // get f() { return this.form.controls; }
  get f() {return this.loginForm.controls;}

  submit(){
    this.submitted = true
    if(this.loginForm.valid){
      let payload = {
        ...this.loginForm.value
      }
      this.callApi.adminLogin(payload).subscribe((res:any) =>{
      if(res.success){
        this.signalService.publishEvent({ EventName: 'firstLogin', EventDetails: res?.data?.login_first });
        sessionStorage.setItem('access_token', res?.data?.token)
        sessionStorage.setItem('role',res?.data?.userDeatils?.role)
        let balance = res?.data?.userDeatils?.balance
        sessionStorage.setItem('balance',balance)
        this.callApi.showSuccess(res.message)
        this.callApi.getToken()
        this.router.navigate(['/dashboard'])
      }
      else{
        this.callApi.showError(res.message)
      }
      })
    }
  }
}
