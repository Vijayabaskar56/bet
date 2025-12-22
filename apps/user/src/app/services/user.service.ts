import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "../../environments/environment.development";
import { ToastrService } from "ngx-toastr";

@Injectable({
  providedIn: 'root'
})

export class UserServices {

  public token: any = this.getToken();
  public subject = new BehaviorSubject<any>('')
  public subject$ = this.subject.asObservable()
  public url = environment.base_url

  public headers = new HttpHeaders().set('_token', (this.token || null))

  constructor(public http: HttpClient, private toastr: ToastrService) { }

  getToken() {
    this.token = localStorage.getItem('access_token');
    this.headers = new HttpHeaders().set('_token', (this.token || false))
    return this.token
  }


  changeNavBar(data: any) {
    this.subject.next(data)
  }

  showSuccess(payload: any) {
    this.toastr.success(payload, 'Success', {
      progressBar: true,
      progressAnimation: 'decreasing',
      timeOut: 3000,
      closeButton: true
    })
  }

  showError(payload: any) {
    this.toastr.error(payload, 'Error', {
      progressBar: true,
      progressAnimation: 'decreasing',
      timeOut: 3000,
      closeButton: true
    })
  }

  showInfo(payload: any) {
    this.toastr.info(payload, 'Info', {
      progressBar: true,
      progressAnimation: 'decreasing',
      timeOut: 3000,
      closeButton: true
    })
  }

  showWarning(payload: any) {
    this.toastr.warning(payload, 'Warning', {
      progressBar: true,
      progressAnimation: 'decreasing',
      timeOut: 3000,
      closeButton: true
    })
  }

  userLogin(payload: any): Observable<any> {
    return this.http.post(this.url + 'user/login', payload)
  }

  publishEvent(message: any) {
    this.subject.next(message);
  }

  subscribeEvent(): Observable<any> {
    return this.subject.asObservable();
  }

  getProfile() {
    return this.http.get(this.url + 'user/profile', { headers: this.headers })
  }

  logout(payload: any) {
    return this.http.post(this.url + 'user/logout', payload, { headers: this.headers })
  }

  changepassword(payload: any) {
    return this.http.post(this.url + 'user/getOtpForChangePassword', payload, { headers: this.headers })
  }

  getLoginDetails(page: any) {
    return this.http.get(this.url + 'user/getUserLoginDetails?page=' + page, { headers: this.headers })
  }

  getSupportChatHistory() {
    return this.http.get(this.url + 'user/chat-history', { headers: this.headers })
  }

  verifyChangePasswordOtp(payload: any) {
    return this.http.post(this.url + 'user/verifyChangePasswordOtp', payload, { headers: this.headers })
  }
  getTransactionHistory(payload: any) {
    let url = this.url + 'user/transaction-history';
    if(payload?.page){
      url += `?page=${payload.page}`
    }
    return this.http.post(url, payload)
  }

}