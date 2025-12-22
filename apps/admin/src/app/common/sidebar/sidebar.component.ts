import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AdminServiceService } from '../../service/admin-service.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  token: any;
  role: any;
  admin: boolean = false;
  subAdmin: boolean = false;
  constructor(private callApi: AdminServiceService,private router: Router){
    this.role = sessionStorage.getItem('role')
    if(this.role == 1){
      this.admin = true
    }
    else{
      this.subAdmin = true
    }
  }
  
  logout(){
    Swal.fire({
      animation : false,
      title: 'Do you want to Logout?',
      iconHtml: '<i class="fas fa-sign-out-alt"></i>',
      showDenyButton: true,
      confirmButtonText: `Yes`,
      denyButtonText: `No`,
    }).then((result:any) => {
      if (result.isConfirmed) {
        this.callApi.logOut().subscribe((res:any) =>{
          if(res.success){
            sessionStorage.clear()
            this.callApi.showSuccess("Logout Successfully")
            this.router.navigate(['/'])
            this.callApi.getToken();
          }
          else{
            this.callApi.showError(res.message)
          }
        })
      }
    });
  }
}
