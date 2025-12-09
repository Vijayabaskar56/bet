import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SignalService {
  private subject = signal<any>(null)

  constructor() { }

  publishEvent(message: any) {
    this.subject.set(message)
  }

  clearEvent() {
    this.subject.set('');
  }

  subscribeEvent() {
    return this.subject;
  }
  
}
