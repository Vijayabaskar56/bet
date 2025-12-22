import { Component, OnInit ,Inject, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserServices } from '../../services/user.service';
import { Router } from '@angular/router';
import { MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

loginForm!:FormGroup;
isSubmitted:Boolean = false;
passwordForm !: FormGroup
isPasswordFormSubmitted:Boolean=false;
isLoginPasswordShown:Boolean = false ;
isOldPasswordShown:Boolean = false;
isnewPasswordShown:Boolean = false;
isCPasswordShown:Boolean = false;
@ViewChild('changepassword') changepassword : ElementRef | any

constructor(public fb:FormBuilder,private callApi:UserServices,public router: Router,private dialog:MatDialog){
  this.callApi.publishEvent({ 'EventName': 'header_reload', 'EventDetail': '' })

}


  ngOnInit(){
    this.createForm()
    this.createPasswordForm()
  }

  createForm(){
    this.loginForm = this.fb.group({
      email:[null,[Validators.required]],
      password:[null, [Validators.required, Validators.minLength(8)]]
    })
  }

  MustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        // return if another validator has already found an error on the matchingControl
        return;
      }

      // set error on matchingControl if validation fails
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    }
  }

  onSubmit(){
    this.isSubmitted = true
    if(this.loginForm.valid){
      this.callApi.userLogin(this.loginForm.value).subscribe({next: (res:any) => {
        if(res.success){
          if(res.data.loginStatus == 2){
            this.callApi.showSuccess(res.message)
          localStorage.setItem("access_token",res.data.token)
          this.callApi.getToken()
         this.loginForm.reset()
         this.router.navigate(["/landing"])
         this.callApi.publishEvent({ 'EventName': 'header_reload', 'EventDetail': '' })
         this.dialog.open(this.changepassword,{
          width: '100%',
            height:"auto",
            minWidth: 'auto',
            maxWidth: '40rem'
       })
          }else{
            this.callApi.showSuccess(res.message)
          localStorage.setItem("access_token",res.data.token)
          localStorage.setItem("showBanner",'true')
          this.callApi.getToken()
         this.loginForm.reset()
         this.router.navigate(["/landing"])
         this.callApi.publishEvent({ 'EventName': 'header_reload', 'EventDetail': '' })
          }

        }
      }, error : (res) => {
        console.log(res)
        this.callApi.showError(res.error.message)
      },})
    }
  }



  createPasswordForm(){
    this.passwordForm = this.fb.group({
      oldPassword:['',[Validators.required]],
      newPassword:['',[Validators.required]],
      confirmPassword:['',[Validators.required]]
    },
    {
      validator: this.MustMatch('newPassword', 'confirmPassword')
    })
  }

  get f() { return this.passwordForm.controls; }

  onChangePassword(){
    this.isPasswordFormSubmitted = true
    if(this.passwordForm.valid){
      this.callApi.changepassword(this.passwordForm.value).subscribe((res:any) => {
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

  onCancel(){
    this.dialog.closeAll()
  }

  onClickIcon(){
    this.isLoginPasswordShown = !this.isLoginPasswordShown
  }

  onClickIconOnChangePass(event:any){
    if(event == 'isOldPasswordShown'){
      this.isOldPasswordShown = !this.isOldPasswordShown
    }else if(event == 'isnewPasswordShown')  {
      this.isnewPasswordShown = !this.isnewPasswordShown
    }else{
      this.isCPasswordShown = !this.isCPasswordShown
    }
  }

  keyPressNumbers(event: any) {
    var charCode = (event.which) ? event.which : event.keyCode;
    if (charCode != 8 && charCode != 13 &&charCode < 46 || charCode > 57 && charCode <= 63 || charCode > 64 && charCode < 65 || charCode > 90 && charCode < 95 || charCode > 122 || charCode == 47) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }


}
