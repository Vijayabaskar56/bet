import { Component } from '@angular/core';
import { AdminServiceService } from '../../service/admin-service.service';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-banking',
  templateUrl: './banking.component.html',
  styleUrl: './banking.component.scss'
})
export class BankingComponent {
  deposited: boolean = false;
  withdrawn: boolean = false;
  type: any;
  submitted = false
  payload: any;
  details: any;
  depositId: any;
  withdrawnId: any;
  transactionDetails: any[] =[];
  data = {
    receiverId : '',
    deposit_amount : 0,
    withdraw_amount : 0,
    type : 0,
    withdraw_sender : ''
  }
  balance: any;
  userDetails : any;

  constructor(private callAPi : AdminServiceService){
    this.balance = sessionStorage.getItem('balance')
  }

  ngOnInit(){
    this.transactionList();
    this.getProfile();
  }

  transactionList(){
    this.callAPi.transactionUserList().subscribe((res:any) =>{
      this.details = res?.data?.pageData
    })
  }
  getProfile(){
    this.callAPi.getProfile().subscribe((res:any) =>{
      this.userDetails = res?.data;
      this.balance = res?.data?.balance;
    })
  }

  depositWithdraw(id:any,data:any){
   if(data == 'deposit'){
    this.data.receiverId = id
    this.data.deposit_amount = Number(this.amt.value)
    this.data.type = 1
    this.data.withdraw_sender =''
    this.data.withdraw_amount = 0
    // this.data = {
    //   receiverId : id,
    //   deposit_amount : Number(this.amt.value),
    //   type : 1
    // }
    this.transactionDetails.push({...this.data});
    this.deposited = true
    this.withdrawn = false
   }
   else{
    this.deposited = false
    this.withdrawn = true
    this.data.withdraw_sender = id,
    this.data.receiverId = ''
    this.data.withdraw_amount = Number(this.amt.value),
    this.data.type = 2
    this.transactionDetails.push({...this.data});
   }   
   return this.type
  }

  amtChanges(id:any){
    console.log(this.transactionDetails,'before');
    
    this.transactionDetails.filter((e:any) =>{
      if(e.receiverId == id){
        e.deposit_amount = 0
        e.deposit_amount = Number(this.amt.value)
        console.log(e.deposit_amount,"e.deposit_amount");
        
        // e.withdraw_amount = 0
      }
      else if(e.withdraw_sender ==id){
        e.withdraw_amount = 0
        e.withdraw_amount = Number(this.amt.value)
        // e.deposit_amount = 0
      }
      else{
        // e.withdraw_amount = 0
        // e.deposit_amount = 0
        // this.clearAmt()
      }
    })

    console.log(this.transactionDetails,'after');
    
  }

  payment(){   
    this.submitted = true
    if(this.password.invalid){
      this.callAPi.showError('Invalid Password')
    } 
    else{
      let multi_trans_data = this.transactionDetails
      let payload = {
        multi_trans_data,
        password: this.password.value
      }
     
     this.callAPi.transaction(payload).subscribe((res:any) =>{
      if(res.success){
        this.callAPi.showSuccess(res.message)
        this.transactionDetails = []
        this.clearAll()
        this.transactionList()
        this.getProfile();
      }
      else{
        this.callAPi.showError(res.message)
      }
     })
    }
  }

  amt = new FormControl('',Validators.required)
  password = new FormControl('',Validators.required)

  clearAll(){
    this.transactionDetails = []
    this.amt.reset()
    this.password.reset()
    this.type = ''
    this.deposited = false
  }

  clearAmt() {
    this.amt.setValue('');
  }
}
