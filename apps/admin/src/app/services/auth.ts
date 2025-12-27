import { Injectable } from '@angular/core';
import { adminLockedClientPlugin, softDeleteClientPlugin } from "@betting/auth/client";
import { createAuthClient } from "better-auth/client";
import { admin } from 'better-auth/plugins';
@Injectable({
  providedIn: 'root',
})
export class Auth {

  public auth = createAuthClient({
    baseURL: 'http://localhost:3000',
    fetchOptions: {
      credentials: 'include'
    },
    plugins: [
      admin(),
      adminLockedClientPlugin(),
      softDeleteClientPlugin(),
    ]
  });


  login(payload: Parameters<typeof this.auth.signIn.email>[0]) {
    return this.auth.signIn.email(payload)
  }
}
