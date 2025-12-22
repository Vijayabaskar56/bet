import { Component,OnInit, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { UserServices } from '../../services/user.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BettingService } from '../../services/betting.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'] // Corrected the styleUrl to styleUrls
})
export class HeaderComponent {
  showUserIcon: boolean = true; // This will control the user icon
  isIconToggled: boolean = false; // Track if the class should be added or removed
  speed: number = 15;
  isActive: boolean = false;
  isDarkMode: boolean = false;
  activeLink: string = '';
  eventSubscription: any = Subscription
  token:any;
  profileDetails:any;
  passwordForm !: FormGroup
  isPasswordFormSubmitted:Boolean=false;
  isLoginPasswordShown:Boolean = false ;
  isOldPasswordShown:Boolean = false;
  isnewPasswordShown:Boolean = false;
  isCPasswordShown:Boolean = false;
  otpSubmit:Boolean = false;
  events : any[] = [];
  leagues : any[] = [];
  menuState: { [key: string]: boolean } = {}

  subMenuState: { [key: string]: boolean } = {};

  activeMenu: string | null = null; // Store active menu name
  activeSubMenu: string | null = null; // Store active submenu name
  
  otp = new FormControl('', [Validators.required])

  searchTerm: string = '';

  constructor(private router: Router,private callApi: UserServices , public dialog : MatDialog , public fb:FormBuilder, private bettingService: BettingService) {
    this.token = this.callApi.getToken()

    this.eventSubscription = this.callApi.subscribeEvent().subscribe((event: any) => {
      if(event?.EventName == 'header_reload'){
          this.token = localStorage.getItem("access_token")
          
      }
    })
  }


  accountClass() {
    this.isActive = !this.isActive; // Toggles the value of isActive
  }
  
  setActiveLink(link: string): void {
    this.activeLink = link;
  }
  ngOnInit() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    this.isDarkMode = darkMode;
    this.updateBodyClass();
    this.token = localStorage.getItem("access_token")
    if(this.token){
      this.callApi.getProfile().subscribe((res:any) => {
        if(res.success){
          this.profileDetails = res.data[0]
          this.upcomingEvents();
        }
      })  
    }

    this.createPasswordForm()
     
  }

  createPasswordForm(){
    this.passwordForm = this.fb.group({
      oldPassword:['',[Validators.required]],
      newPassword:['',[Validators.required]],
      confirmPassword:['',[Validators.required]]
    },
    {
      validator: this.MustMatch('newPassword', 'confirmPassword')
    })
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
    this.accountClass();
    this.router.navigate([`/${data}`])
  }
  

  toggleMenu(menu: string): void {
    this.menuState[menu] = !this.menuState[menu];
    this.activeMenu = this.activeMenu === menu ? null : menu; // Toggle active menu
    Object.keys(this.menuState).forEach((key) => {
      if (key !== menu) {
        this.menuState[key] = false;
      }
    });
  }

  toggleSubMenu(subMenu: string, event: Event): void {
    event.stopPropagation();
    this.subMenuState[subMenu] = !this.subMenuState[subMenu];
    this.activeSubMenu = this.activeSubMenu === subMenu ? null : subMenu; // Toggle active submenu
  }

  async logOut(){
    Swal.fire({
      title: 'Do you want to Logout?',
      iconHtml: '<i class="fas fa-sign-out-alt"></i>',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: `Yes`,
      denyButtonText: `No`,
    }).then((result) => {
      if (result.isConfirmed) {
        this.callApi.logout({}).subscribe((res:any) => {
          if(res.success){
            localStorage.clear()
            this.callApi.showSuccess(res.message)
            this.router.navigate(['/login'])
          }else{
            this.callApi.showError(res.message)
          }

        })
      }
    })
  }

  onClickChangePassword(template:TemplateRef<any>){
    this.dialog.open(template,{
      width: '100%',
      height:"auto",
      minWidth: 'auto',
      maxWidth: '40rem'
    })
  }
  

  onCancel(){
    this.dialog.closeAll()
  }

  onClickIcon(){
    this.isLoginPasswordShown = !this.isLoginPasswordShown
  }

  onClickIconOnChangePass(event:any){
    if(event == 'isOldPasswordShown'){
      this.isOldPasswordShown = !this.isOldPasswordShown
    }else if(event == 'isnewPasswordShown')  {
      this.isnewPasswordShown = !this.isnewPasswordShown
    }else{
      this.isCPasswordShown = !this.isCPasswordShown
    }
  }

  
  MustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        // return if another validator has already found an error on the matchingControl
        return;
      }

      // set error on matchingControl if validation fails
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    }
  }
  
  onChangePassword(template:TemplateRef<any>){
    this.isPasswordFormSubmitted = true
    if(this.passwordForm.valid){
      this.callApi.changepassword(this.passwordForm.value).subscribe((res:any) => {
        if(res.success){
          this.callApi.showSuccess(res.message)
          if(res.data.email){
              this.dialog.open(template,{
                width: '100%',
                height:"auto",
                minWidth: 'auto',
                maxWidth: '40rem'
              })
          }else{
            this.dialog.closeAll()
          }

        }
        else{
          this.callApi.showError(res.message)
        }
      })
    }
  }

  submitOtpForm(){
    if(this.otp.valid){
    let payload = {otp:this.otp.value}
    this.callApi.verifyChangePasswordOtp(payload).subscribe((res:any) => {
      if(res.success){
        this.callApi.showSuccess(res.message)
        this.dialog.closeAll()
      }else{
        this.callApi.showError(res.message)
      }
    })
  }
  }

  upcomingEvents() {
    this.bettingService.getUpcomingEvents().subscribe((response : any) => {
      if(response.success) {
        this.events = response?.data?.events;
        this.leagues = response?.data?.leagues;
        if(this.leagues.length >0) {
          this.leagues.forEach((league) => {
            this.menuState[league.name] = false;
          })
        }
      }
    })
  }

  getFilteredMatches(submenu: any): any[] {
    if (!this.searchTerm) {
      return submenu.matches;
    }
    const lowerSearch = this.searchTerm.toLowerCase();
    return submenu.matches.filter((match : any) => 
      match.matchName && match.matchName.toLowerCase().includes(lowerSearch)
    );
  }

  // Helper method to check if a category has at least one submenu with matches
  hasMatches(category: any): boolean {
    return category.submenus.some((submenu : any) => this.getFilteredMatches(submenu)?.length > 0);
  }

}
