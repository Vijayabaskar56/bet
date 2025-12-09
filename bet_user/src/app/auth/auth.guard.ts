import { CanActivateFn , Router } from '@angular/router';
import { UserServices } from '../services/user.service';
import {inject} from '@angular/core'

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router)
  const callApi = inject(UserServices)

  const token = localStorage.getItem('access_token')
  if(!token){
    callApi.getToken();
    callApi.showError('Please Login First!');
    router.navigate(['/login']);
    return false;
  }else{
    return true;
  }
};

export const checkGuard: CanActivateFn = (route, state) => {

  const router = inject(Router)
  const callApi = inject(UserServices)

  const token = localStorage.getItem('access_token')
  if(!token){
    callApi.getToken();
    return true;
  }else{
    router.navigate(['/landing']);
    return false;
  }
};
