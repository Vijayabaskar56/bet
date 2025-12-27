import { Component, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  _api = inject(Auth);

  showPassword: boolean = false;
  submitted: boolean = false;


  submit(form: NgForm) {
    this.submitted = true;
    if (form?.valid) {
      this.submitted = false;
      const payload = {
        ...form.value
      }
      payload.rememberMe = true
      payload.callbackURL = '/'
      this._api.login(payload)
    }
  }
}
