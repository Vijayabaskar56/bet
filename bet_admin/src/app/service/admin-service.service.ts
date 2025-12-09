import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment.development';



@Injectable({
  providedIn: 'root'
})
export class AdminServiceService {
  public url = environment.base_url
  public token: any = this.getToken();
  public headers = new HttpHeaders().set('_token', (this.token || null))
  private subject = new BehaviorSubject<any>('');
  // private subject = signal<any>('')

  constructor(private http: HttpClient, private toastr: ToastrService) { }

  getToken() {
    this.token = sessionStorage.getItem('access_token');
    this.headers = new HttpHeaders().set('_token', (this.token || false))
    return this.token
  }

  publishEvent(message: any) {
    this.subject.next(message);
  }

  clearEvent() {
    this.subject.next('');
  }

  subscribeEvent() {
    return this.subject.asObservable();
  }

  showSuccess(message: any) {
    this.toastr.success(message)
  }

  showError(message: any) {
    this.toastr.error(message)
  }

  closeMessage(message: any) {
    this.toastr.remove(message)
  }

  adminLogin(payload: any) {
    return this.http.post(this.url + 'admin/login', payload)
  }
  getProfile() {
    return this.http.get(this.url + 'admin/profile',  { headers: this.headers })
  }

  createSubAdmin(payload: any) {
    return this.http.post(this.url + 'admin/subadmincreate', payload, { headers: this.headers })
  }

  getAdminList(payload: any, page: any) {
    return this.http.post(this.url + `admin/create_admins_list?page=${page}`, payload, { headers: this.headers })
  }

  createMaster(payload: any) {
    return this.http.post(this.url + 'admin/createMaster', payload, { headers: this.headers })
  }

  getMasterList(role: any, page: any, user_name: any) {
    return this.http.get(this.url + `admin/getUser?role=${role}&page=${page}&user_name=${user_name}`, { headers: this.headers })
  }

  logOut() {
    return this.http.get(this.url + 'admin/logOut', { headers: this.headers })
  }

  chatListing(page: any, user_name: any) {
    return this.http.get(this.url + `admin/messages?page=${page}&user_name=${user_name}`, { headers: this.headers })
  }

  chatHistory(id: any) {
    return this.http.get(this.url + `admin/chat-history/${id}`, { headers: this.headers })
  }

  getChatHistory() {
    return this.http.get(this.url + `admin/chat-history`, { headers: this.headers })
  }

  putChatList(payload: any) {
    return this.http.put(this.url + 'admin/messages', payload, { headers: this.headers })
  }

  transactionHistory(page: any) {
    return this.http.post(this.url + `admin/transaction_his?page=${page}`, {}, { headers: this.headers })
  }

  transaction(payload: any) {
    return this.http.post(this.url + 'admin/admin_Transaction', payload, { headers: this.headers })
  }

  addAdminBalance(payload: any) {
    return this.http.post(this.url + 'admin/admin_balns_create', payload, { headers: this.headers })
  }

  transactionUserList() {
    return this.http.get(this.url + 'admin/getBalanceDetails', { headers: this.headers })
  }

  // announcement
  createAnnouncement(payload: any) {
    return this.http.post(`${this.url}admin/bannerCreate`, payload, { headers: this.headers })
  }
  getAnnouoncement() {
    return this.http.get(`${this.url}admin/getActiveBanners`, { headers: this.headers })
  }
  getUserBetHistory(payload:any,page:Number,limit:number){
    return this.http.post(this.url+`admin/user-bet-history?page=${page}&limit=${limit}`,payload,{headers : this.headers})
  }

  getLimitSettings(){
    return this.http.get(this.url + 'admin/getLimitSettings',{headers:this.headers})
  }

  updateLimitSettings(payload:any){
    return this.http.post(this.url + 'admin/betLimit',payload,{headers:this.headers})
  }
  updateControls(payload:any){
    return this.http.post(this.url + 'admin/updateControls',payload,{headers:this.headers})
  }
}
