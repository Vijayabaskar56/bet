import { Component } from '@angular/core';
import { SocketService } from '../../service/socket.service';
import { AdminServiceService } from '../../service/admin-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';


@Component({
  selector: 'app-supportchat',
  templateUrl: './supportchat.component.html',
  styleUrl: './supportchat.component.scss'
})
export class SupportchatComponent {
  chat_id: any;
  chatData: any;

  constructor(private socket : SocketService, private callApi: AdminServiceService,private route : ActivatedRoute, private router : Router){
    this.route.queryParams.subscribe((res:any) =>{
     this.chat_id = res?.id
    })
    this.socket.receiveMessage('connectChat').subscribe((res:any) =>{
      console.log(JSON.parse(res));
    })

    this.socket.receiveMessage('sendMsg').subscribe((res:any) =>{
      let last_message = JSON.parse(res)
      console.log(last_message,"this.chatData");
      if(last_message?.result?.message){
        this.chatData.push(last_message.result)
      }
    })
    
  }

  ngOnChanges(){
    this.sendMessageFn(true)
  }
  
  ngOnInit(){
    this.getChat(true);
    this.chatHistory();
    this.updateChat()
  }
  getChat(status: any) {
    let roomPayload = {
      "params": "connectChat",
      "_token": this.callApi.getToken(),
      "receiverId" : this.chat_id,
      "status" : true
    }
    this.socket.sendMessage(roomPayload)
  }
  sendmessage = new FormControl('', Validators.required)
  
  sendMessageFn(status:any) {
    let chattingPayload ={
      "params": "sendMsg",
      "_token": this.callApi.getToken(),
      "receiverId" : this.chat_id,
      "status" : status,
      "message" : this.sendmessage.value
    }
    this.socket.sendMessage(chattingPayload)
    this.sendmessage.setValue('')
    this.chatHistory()
  }
  ngOnDestroy(){
    this.getChat(false)
  }

  back(){
    this.router.navigate(['/chatlist'])
  }

  chatHistory(){
    if(this.chat_id){
      this.callApi.chatHistory(this.chat_id).subscribe((res:any) =>{
        this.chatData = res?.data
      })
    }
    else{
      this.callApi.getChatHistory().subscribe((res:any) =>{
        this.chatData = res?.data
      })
    }
  }

  updateChat(){
    let payload = {
      "chatId" : this.chat_id,
    }
    this.callApi.putChatList(payload).subscribe((res:any) =>{
    })
  }
}
