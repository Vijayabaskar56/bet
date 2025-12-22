import { Injectable } from '@angular/core';
import {io} from 'socket.io-client'
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';
import * as CryptoJS from 'crypto-js';


@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket:any
  public token:any

  constructor() { 
    if(this.socket?.connected !== true ){
      this.socket = io(environment.socket_url)
      this.initialEventConnect()
    }
      
  }

  initialEventConnect(){
    this.token = localStorage.getItem('access_token')
    if(this.token){
      let socketData = {
        'params':'connectSocket',
        "_token" : this.token
      }
      this.sendMessage(socketData)
    }
  }

 public sendMessage(message:any){
    this.socket.emit(message.params,message)
  }

  public getMessages = () => {
    return Observable.create((observer: any) => {
      this.socket.on('receive', (message: any) => {
        observer?.next(message);
      })
      return () => {
        this.socket.disconnect();
      }
    });
  }

  public receiveMessage = (event: string): Observable<any> => {
    return new Observable((observer: any) => {
      this.socket.on(event, (message: any) => {
          try {
            if (message instanceof ArrayBuffer) {
              const jsonString = new TextDecoder('utf-8').decode(message);
              const data = JSON.parse(jsonString);
              if(data){
                const encryptedData = data;
                const SECRET_KEY = environment.CLIENT_SECRET;
                const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
                const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                observer.next(decryptedData)
              }
              else {
                observer.next(data);
              }
            }
            else {
              observer.next(message);
            }
          } catch (error) {
              console.error('Error parsing message:', error);
              observer.error(error);
          }
      });
  
      return () => {
          this.socket.disconnect();
      };
  });
  }

  public eventComplete(event:string){
    this.socket.off(event)
  }  



}
