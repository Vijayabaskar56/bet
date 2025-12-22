import { Component, TemplateRef } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
// import { environment } from '../../../environments/environment.prod';
// import { AdminService } from '../../service/admin.service';;
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment.development';
import { AdminServiceService } from '../../service/admin-service.service';
@Component({
  selector: 'app-user-engagement',
  templateUrl: './user-engagement.component.html',
  styleUrls: ['./user-engagement.component.scss']
})
export class UserEngagementComponent {
  userList: any;
  teamFormData: any;
  url: any;
  userid: any;
  // public Editor:any = ClassicEditor;
  CreatedBy: any;
  button = 'Search'
  isLoading : boolean =false
   formSubmitted: boolean = false;
   page:any={page_no:1,total_page:'',itemsPerPage:environment.PAGE_SIZE};
  payload: any;
  fileRef : any;


  //   // Pagination variables
  // currentPage: number = 1;
  // itemsPerPage: number = 5; // Number of items per page
  // totalPages: number = 5;


  constructor( private callApi: AdminServiceService,private dialog: MatDialog, private fb :FormBuilder) { }

  ngOnInit(): void {
    this.UserEngagement({})
        this.teamForm()
  }
  username = new FormControl('',[Validators.required])

  teamForm() {
    this.teamFormData = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: ['',[Validators.required]],
    })
  }
  clearData(){
    this.username.reset()
    this.UserEngagement({});

  }
 
  UserEngagement(data:any) {
    this.payload = data;
    let payload ={
      auth_name: this.username.value,
    }
    this.callApi.getAnnouoncement().subscribe((res: any) => {
      console.log(res,"okkk");
      
      this.userList = res?.data;
      this.page.total_page = res?.data?.toatalcount
      this.button = 'Search'
      this.isLoading = false
      this.userList.forEach((item: any) => {
        const parts = item.image.split('/');
        const encodedFileName = parts.pop();
        const filenameParts = encodedFileName.split('_');
        const extension = filenameParts[2];
        const filename = filenameParts[1];
        item.fileName = `${filename}.${extension}`;
      });
    },(err:any)=>{
      this.button = 'Search'
      this.isLoading = false
    });
  }
  
  filterdata(){
    if(  this.username.valid ){ 
     
    let payload = {
      auth_name: this.username.value,
    }
    // this.UserEngagement({})

    }
    else{
      this.callApi.showError('kindly give any input !')
    }
  }
  serial(data:any){
    return Number(((this.page-1)*5) + data+1)
  }

  getDataa(data:any){
    let result = '';
    if (data?.createdBy !== null && data?.createdBy !== undefined) {
      result += `CreatedBy: ${data.createdBy}`;
    }
    if (data?.updatedBy !== null && data?.createdBy !== undefined) {
      if (result !== '') {
        result += ', ';
      }
      result += `UpdatedBy: ${data.updatedBy}`;
    }
    return this.CreatedBy = result;
    // return this.CreatedBy=!data?.createdBy && !data?.updatedBy?'':`CreatedBy: ${data?.createdBy}, UpdatedBy  ${data?.updatedBy}` 
    }
    
    edit(templateRef: TemplateRef<any>, data: any) {
      console.log(data,"okk");
      
      this.userid = data;
      this.url = this.userid?.banner_image;
      this.teamFormData.patchValue({
          title: this.userid.title,
          content: this.userid.content,
          description: this.userid.description,
          image: null  // Clear the image field initially
      });
      this.dialog.open(templateRef, {
          disableClose: true,
          width: "auto"
      });
  }
  
  User( templateRef :TemplateRef<any>){
    this.formSubmitted = false;
    this.dialog.open(templateRef,{
       width:'auto',
       height:'auto'
     }) 
   }
   
  Update(form:any) {
    let formData:FormData = new FormData()
    formData.append("title",form.value.title)
    formData.append("description",form.value.description)
    formData.append("banner_image",this.fileRef)
    this.callApi.createAnnouncement(formData).subscribe((res: any) => {
      if (res.success) {
        this.callApi.showSuccess(res.message);
        this.dialog.closeAll()
        this.UserEngagement({})
        this.teamFormData.reset()
        this.url = null
      }
      else{
        this.callApi.showError(res.message);
      }
    },)
}
 
onFileChanged(event: any) {
  const file = event.target.files[0];
  if (file) {
      this.teamFormData.patchValue({
          image: file
      });
      this.teamFormData.get('image')?.updateValueAndValidity();

      const reader = new FileReader();
      reader.onload = () => {
          this.url = reader.result as string;  // Update url with new image data
      };
      reader.readAsDataURL(file);

      // Update fileName display
      const parts = file.name.split('.');
      const filename = parts[0];
      const extension = parts[1];
      this.userid.fileName = `${filename}.${extension}`;
      this.fileRef = file;
  }
}

  get f() { return this.teamFormData?.controls; }
  submitteam(form: any) {
    this.formSubmitted = true;
    if (this.teamFormData.valid) {
      let formData: FormData = new FormData()
      formData.append("title", form.value.title)
      formData.append("description", form.value.description)
      formData.append("banner_image", form.value.image)
      this.callApi.createAnnouncement(formData).subscribe((res: any) => {
        if (res.success) {
          this.formSubmitted = false;
          this.dialog.closeAll()
          this.callApi.showSuccess(res.message);
          // this.UserEngagement({})
          this.teamFormData.reset()
          this.url = null
        } else {
          this.callApi.showError(res.message);
          this.formSubmitted = false
        }
      },)
    }
  }


}
