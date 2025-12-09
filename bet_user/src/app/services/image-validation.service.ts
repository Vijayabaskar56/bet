import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageValidationService {
  allowedFileExtensions = ['image/jpg', 'image/jpeg', 'image/png'];
  constructor() { }

  fileUploadValidator(event:any): boolean{
    let type = event?.target?.files[0].type    
    for(let item =0;item<=this.allowedFileExtensions.length;item++){
      if(this.allowedFileExtensions[item]==type){
        return true
      }
    }
    return false
  }
}
