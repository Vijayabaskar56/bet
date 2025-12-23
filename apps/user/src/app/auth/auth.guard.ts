import { CanActivateFn, Router } from '@angular/router';
import { UserServices } from '../services/user.service';
import { inject } from '@angular/core'
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const checkGuard: CanActivateFn = (route, state) => {
  //TODO: need to check the role
  const router = inject(Router)
  const callApi = inject(UserServices)

  const token = localStorage.getItem('access_token')
  if (!token) {
    callApi.getToken();
    return true;
  } else {
    router.navigate(['/landing']);
    return false;
  }
};
