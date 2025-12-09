import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment-timezone';
import { SocketService } from '../../services/socket.service';
import { UserServices } from '../../services/user.service';
import { FilterPipe } from "../../pipe/filter.pipe";
import { ImageValidationService } from '../../services/image-validation.service';

@Component({
  selector: 'app-support-chat',
  templateUrl: './support-chat.component.html',
  styleUrl: './support-chat.component.scss'
})
export class SupportChatComponent implements OnInit {
 
  form !: FormGroup
  ticketstatus:any;
  searchText:any;
  ticket:any;
  settingsData:any;
  ticket_id:any;
  ticketID:any;
  userMessage: any= [];
  imagePath:any;
  unReadCount:number= 0;
  status:any;
  formSubmitted: boolean = false
  preview:any;
  previewImg:any;
  submitted:boolean = false;
  forms:any = {};
  token:any;
  uploadedImage: any;
  moment :any = moment;
  selectImg: any;
  user_id:any;
  constructor(public fb:FormBuilder,public dialog:MatDialog , public socket:SocketService,public callApi:UserServices,public validimage:ImageValidationService){
    this.token = localStorage.getItem('access_token')
  }

  ngOnInit(){
    this.connectSupportChatSocket()
    this.socket.receiveMessage('connectChat').subscribe((res:any) => {
    }) 

    this.socket.receiveMessage('sendMsg').subscribe(async (res: any) => {
      const data = await JSON.parse(res);
      
      this.userMessage = this.userMessage || [];
      if (Array.isArray(this.userMessage)) {
        this.userMessage?.push(data.result);
      }
    });
    
    this.getChathistory()
     
  }

  connectSupportChatSocket(){
    let payload = {
      params:"connectChat",
      _token:this.token,
      status:true
    }
    this.socket.sendMessage(payload)
  }

  createform() {
    this.form = this.fb.group({
      title: [null, [Validators.required, Validators.minLength(3), Validators.pattern(/^\S*$/)]],
      description: [null, [Validators.required, Validators.minLength(3)]]
    })
   
  }

  get f() { return this.form.controls; }

  openDialog(template:TemplateRef<any>){
    this.dialog.open(template,{
      width: "100%",
      height: "auto",
      minWidth: 'auto',
      maxWidth: '35rem'

    })
  }

  ticketById(data:any){}

  clear(){}

  formSubmit(event:any){
    this.formSubmitted = true
  }

  async uploadImage(event: any) {
    let data = this.validimage.fileUploadValidator(event)
    if (data == false) {
      this.callApi.showError('File Format Like JPG,PNG,JPEG')
    } else {
      if (event.target.files[0].size > 2000000) {/* checking size here - 2MB */
        this.callApi.showError('File upload size is larger than 2MB')
      } else {
        this.formSubmitted = true
        this.preview = false
        this.selectImg = event.target.files[0];

        let reader = new FileReader();
        reader.onload = ((image: any) => {
          this.previewImg = image.target.result
        })
        reader.readAsDataURL(event.target.files[0])
        let formData = new FormData()
        formData.append('image', this.selectImg)
        // this.callApi.sendSupportImage(formData).subscribe(async (res: any) => {
        //   if (res.success == true) {
        //     this.uploadedImage = res.data
        //   }
        //   else {
        //     event.preventDefault()
        //     localStorage.removeItem('image')
        //     this.callApi.showError(res.message)
        //   }
        // })
      }
    }
  }

  check(){}

  createTicket(){}

  onScroll(event:any){}

  sendMessages(value:any){
    if(value.form?.value?.message !== ''){
      let payload = {
        params:"sendMsg",
        message:value.form?.value?.message,
        _token:this.token,
        role:5
      }
      this.socket.sendMessage(payload)
      this.forms.message = ''
      
    }
  }

  getChathistory(){
      this.callApi.getSupportChatHistory().subscribe((res:any) => {
            if(res.success){
              this.userMessage = res.data
            }
      }) 
  }
}
