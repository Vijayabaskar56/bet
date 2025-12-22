import { Component } from '@angular/core';
import { AdminServiceService } from '../../service/admin-service.service';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-user-bet-history',
  templateUrl: './user-bet-history.component.html',
  styleUrl: './user-bet-history.component.scss'
})
export class UserBetHistoryComponent {
  historyData :any = [];
  searchData:any = {};
  page:any = {page_no:1,total_page:'',itemsPerPage:environment.PAGE_SIZE}
  constructor(private callApi : AdminServiceService){ } 
  ngOnInit():void{
    this.getData();
  }
  getData(payload: any = {},page:number = 1){
    this.callApi.getUserBetHistory(payload,page,environment.PAGE_SIZE ?? 5).subscribe((res:any)=>{
        if(res && res?.success){
            this.historyData = res?.data?.result
            this.page.total_page = res?.data?.totalCount;
            this.page.s_no = (page-1) * environment.PAGE_SIZE;
        }
    })
  }
  filterData(status:any){
    let value = Object.keys(this.searchData).length;
    if(value){
        if(!status)  this.searchData={};
        else this.searchData.filtered  = true;
        this.getData(this.searchData,1);
        this.page.page_no = 1;
    }
  }
  handleEvent = (event: any) =>(this.getData(this.searchData.filtered ? this.searchData:null,event));
  dropDownChanges = (key:string , event:any) => (this.searchData[key] = event?.target?.value);
}
