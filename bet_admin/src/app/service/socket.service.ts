import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  public socket: any;
  token: any;
  constructor() {
    if(this.socket?.connected!==true){
      this.socket = io(environment.SOCKET_URL)
      this.initialEventConnect()
    }
  }

  initialEventConnect() {
    this.token = localStorage.getItem('token')
    if (this.token) {
      let socketData = {
        "params": 'connectSocket',
        "_token": this.token
      }
      this.sendMessage(socketData)
    }
  }

  public sendMessage(message: any) {
    this.socket.emit(message?.params, message);
  }

  public getMessages = () => {
    return Observable.create((observer: any) => {
      this.socket.on('receive', (message: any) => {
        observer.next(message);
      })
      return () => {
        this.socket.disconnect();
      }
    });
  }
  public receiveMessage = (event:any) => {
    return Observable.create((observer: any) => {
      this.socket.on(event, (message: any) => {
        observer.next(message);
      })
      return () => {
        this.socket.disconnect();
      }
    });
  }
  public eventComplete(event:string){
    this.socket.off(event)
  }
}
