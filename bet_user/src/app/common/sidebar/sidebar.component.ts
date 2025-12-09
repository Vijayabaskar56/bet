import { Component } from '@angular/core';
import { UserServices } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isActive: boolean = false;
  isDarkMode: boolean = false;
  activeTab:any;

  constructor(private callApi: UserServices,private router:Router,private route: ActivatedRoute){}

  ngOnInit(): void{
    const darkMode = localStorage.getItem('darkMode') === 'true';
    this.isDarkMode = darkMode;
    this.updateBodyClass();
    
    this.callApi.subject$.subscribe((res:any)=>{
      this.activeTab = res
    })
    let url = (this.route.snapshot as any)._routerState.url;
    this.activeTab = url.split('/')[1]
  }
  onToggleDarkMode(event: Event) {
    this.isDarkMode = (event.target as HTMLInputElement).checked;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    this.updateBodyClass();
  }

  updateBodyClass() {
    const body = document.body;
    if (this.isDarkMode) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }

  changeNav(data:any){
    this.callApi.changeNavBar(data)
    this.router.navigate([`/${data}`])
  }

}
