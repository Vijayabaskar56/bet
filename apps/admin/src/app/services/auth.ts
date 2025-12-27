import { Injectable } from '@angular/core';
import { createAuthClient } from "@better-auth/client";
@Injectable({
  providedIn: 'root',
})
export class Auth { 
      
      public auth = createAuthClient()({
        
        baseURL:'http://localhost:3001/api/auth',
        betterFetchOptions:{
         credentials:"include",
         
         
        }
      });

      
      login(payload:any){
        return this.auth.signIn({payload,provider:'email'})
      }
}
