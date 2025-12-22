import { Component } from '@angular/core';
import { AdminServiceService } from '../../service/admin-service.service';

@Component({
  selector: 'app-block-market',
  templateUrl: './block-market.component.html',
  styleUrl: './block-market.component.scss'
})
export class BlockMarketComponent {
  controls : any[] = [];

  constructor(private callApi : AdminServiceService) {

  }

  ngOnInit() {
    this.getLimitSettings();
  }


  getLimitSettings(){
    this.callApi.getLimitSettings().subscribe((res:any)=>{
      if(res?.success){
        this.controls = res?.data?.controls;
  
      } else{
        console.log(res.message);
      }
    })
  }

  onStatusChange(item: any, event: any) {
    item.status = event.target.checked; // Update item status
    // console.log(`Sport ID: ${item.sportid}, Status: ${item.status}`);
    this.updateStatus(item);
  }
  
  updateStatus(item: any) {
    // console.log('Market Status Updated', item);
    this.callApi.updateControls(item).subscribe((res : any) => {
      if(res.success){
        this.callApi.showSuccess(res.message);
      }
    })
  }
}
