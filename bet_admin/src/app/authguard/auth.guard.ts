import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminServiceService } from '../service/admin-service.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AdminServiceService);
  const token = authService.getToken()
  if(token){
    return true;
  }
  else{
    router.navigate(['/']);
    authService.showError('Please Login First!')
    return false;
  }
};
