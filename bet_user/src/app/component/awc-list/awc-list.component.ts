import { Component, ElementRef, ViewChild } from '@angular/core';
declare let Swiper: any;

@Component({
  selector: 'app-awc-list',
  templateUrl: './awc-list.component.html',
  styleUrl: './awc-list.component.scss'
})
export class AwcListComponent {
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;
  isTogglerActive = false;

  ngAfterViewInit() {
    // Horizontal Swiper
    const swiper = new Swiper(".awc_list", {
      slidesPerView: "auto",
      spaceBetween: 10,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    });
  }
}
