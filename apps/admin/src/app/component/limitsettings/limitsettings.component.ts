import { Component, OnInit, TemplateRef, inject } from '@angular/core';
import { AdminServiceService } from '../../service/admin-service.service';
import { Toast, ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { max } from 'rxjs';

@Component({
  selector: 'app-limitsettings',
  templateUrl: './limitsettings.component.html',
  styleUrl: './limitsettings.component.scss'
})
export class LimitsettingsComponent implements OnInit {


  ngOnInit(): void {
    this.getLimitSettings();
  }
  limitForm: any;
  limitsData: any;
  selectedKey: any;
  selectedMinBet: any;
  selectedMaxBet: any;
  callApi = inject(AdminServiceService);
  toaster = inject(ToastrService)
  constructor(private fb: FormBuilder) {
    this.limitForm = this.fb.group({
      title: ['', [Validators.required]],
      minBet: ['', [Validators.required]],
      maxBet: ['', [Validators.required]]
    })
  }


  selectLimit(key: string, minBet: any, maxBet: any) {
    this.selectedKey = key;
    this.selectedMinBet = minBet;
    this.selectedMaxBet = maxBet;
    this.limitForm.patchValue({
      title: this.selectedKey,
      minBet: this.selectedMinBet,
      maxBet: this.selectedMaxBet
    })
  }

  getLimitSettings() {
    this.callApi.getLimitSettings().subscribe((res: any) => {
      if (res?.success) {
        delete res?.data?.controls;
        this.limitsData = res?.data;
        this.limitsData = res?.data ? this.removeId(res?.data) : {};

      } else {
        console.log(res.message);
      }
    })
  }
  removeId(data: any) {
    const { _id, ...cleanedData } = data;
    return cleanedData;
  }

  objectKeys(obj: any): any[] {
    return obj ? Object.keys(obj) : [];
  }

  updateLimitSettings() {
    let payload = {
      [this.limitForm.value.title]: {
        minBet: this.limitForm.value.minBet,
        maxBet: this.limitForm.value.maxBet,

      }
    }
    this.callApi.updateLimitSettings(payload).subscribe((res: any) => {
      if (res?.success) {
        this.toaster.success(res.message);
        this.getLimitSettings();
      } else {
        this.toaster.error(res.message)
      }
    })
  }
}
