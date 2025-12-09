import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AdminServiceService } from '../service/admin-service.service';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../environments/environment.development';

@Injectable()
export class apiHandlerInterceptor implements HttpInterceptor {

  constructor(private apiService: AdminServiceService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone the request to add the Authorization header with the token
    const token = this.apiService.token;  // Get the token from sessionStorage or any other store

    if (token) {
      req = req.clone({
        setHeaders: {
          _token: token
        }
      });
    }

    // Proceed with the request
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          if (event?.body?.encrypted) {
            let decryptedData = this.decryptResponse(event?.body?.encrypted);
            event = event.clone({ body: decryptedData });
          }
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error?.error?.encrypted) {
          let decryptedData = this.decryptResponse(error?.error?.encrypted);
          this.apiService.showError(decryptedData?.message || error.message);
        }
        else {
          this.apiService.showError(error?.error?.message || error?.message);
        }
        

        if (error.status === 498) {
          localStorage.clear();
          this.router.navigate(['/']);
        }

        throw error; // rethrow the error so the caller can handle it as well
      })
    );
  }

  decryptResponse(encryptedData: any) {
    try {
      const SECRET_KEY = environment.CLIENT_SECRET;
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return  decryptedData;
    } catch (error) {
      console.log('Error while decrypt data:', error);
    }
  }
}
