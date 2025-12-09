import { Component, OnInit } from '@angular/core';
import { UserServices } from '../../services/user.service';

@Component({
  selector: 'app-activitylogs',
  templateUrl: './activitylogs.component.html',
  styleUrl: './activitylogs.component.scss'
})
export class ActivitylogsComponent implements OnInit {

  loginDetails:any;
  pageDet:any={page_no:1,total_page:'',itemsPerPage:5};

  constructor(public callApi : UserServices){}

  ngOnInit(){
    this.getLogindetails()
  }

  getLogindetails(){
      this.callApi.getLoginDetails(1).subscribe((res:any) => {
        if(res.success){
          this.loginDetails = res.data.result
          this.pageDet.total_page = res.data.totalCount
        }
      })
  }

  handlePageEvent(page:any){
    this.pageDet.page_no = page
    this.getLogindetails()
  }

}
