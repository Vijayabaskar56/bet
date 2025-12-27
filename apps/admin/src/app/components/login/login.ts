import { Component, inject } from '@angular/core';
import { Auth } from '../../services/auth';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  _api = inject(Auth);

  showPassword:boolean = false;
  submitted:boolean = false;


  submit(form:NgForm){
    this.submitted = true;
    if(form?.valid){
      this.submitted = false;
      const payload = {
        ...form.value
      }
      payload.rememberMe = null
      payload.callbackURL = null
      this._api.login(payload)
    }
  }
}
