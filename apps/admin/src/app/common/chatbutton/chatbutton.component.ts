import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { AdminServiceService } from '../../service/admin-service.service';
import { Router } from '@angular/router';
import { SignalService } from '../../service/signal.service';

@Component({
  selector: 'app-chatbutton',
  templateUrl: './chatbutton.component.html',
  styleUrl: './chatbutton.component.scss'
})
export class ChatbuttonComponent {
  params!: ICellRendererParams;
  message : any;
  receivedSignal: any;
  unrealmessage: any;

  constructor(private callApi: AdminServiceService, private router : Router, private signalService : SignalService) { }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    console.log(this.params,"id");
    this.unrealmessage = this.params?.data?.unreadMessage
  }

  chat(){
    const id = this.params?.data._id;
    this.router.navigate(['supportChat'] ,{ queryParams: {id : id, role : this.params?.data?.role}})
  }
}
