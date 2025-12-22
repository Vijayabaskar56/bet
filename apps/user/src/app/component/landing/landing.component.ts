import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BettingService } from '../../services/betting.service';
declare let Swiper: any;


@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;
  isTogglerActive = false;
  matches : any[] = [];
  showBanner: boolean = false;
  activeSportId : any = this.matches.length > 0 ? this.matches[0].sportid : null;
  activeSportMatches : any[] = this.matches.length > 0 ? this.matches[0].matchList : [];
  bannerSlides : any[]=  [
    "../../../assets/images/header/header-1.png",
    "../../../assets/images/header/header-2.png",
    "../../../assets/images/header/header-3.png",
    "../../../assets/images/header/header-4.png",
    "../../../assets/images/header/header-5.png",
    "../../../assets/images/header/header-6.png",
    "../../../assets/images/header/header-7.png"
  ]
  bannerImage: any;
  DataDeatils:any
  discrption:any
  constructor(private bettingService: BettingService,  private router: Router) {

  }

  setActive(sport: any) {
    this.activeSportId = sport.sportid;
    this.activeSportMatches = sport.matchList
  }
  ngOnInit() { 
    
    const isVisible = localStorage.getItem('showBanner') || null;
    if (isVisible) {
      this.showBanner = true;
      localStorage.removeItem('showBanner')
    }

    // Fetch banner image from API
    this.bettingService.getAnnouoncement().subscribe((res: any) => {
      this.bannerImage = res.data[0].banner_image; // Set the image dynamically
      this.DataDeatils = res?.data[0]?.title
      this.discrption = res?.data[0]?.description
    });

    this.getLandingData();
  }

  closeBanner() {
    this.showBanner = false;
    localStorage.removeItem('showBanner');
  }

  getLandingData() {
    this.bettingService.getLandingData().subscribe((response : any) => {
      if(response.success) {
        this.matches =  response.data?.matches;
        this.bannerSlides =  response.data?.banners;
        this.activeSportId = this.matches.length > 0 ? this.matches[0].sportid : null;
        this.activeSportMatches = this.matches.length > 0 ? this.matches[0].matchList : null;
        this.initSwiper();
      }
    })
  }

  viewMatch(matchId: String) {
    this.router.navigate(['/match-details', this.activeSportId, matchId]);
    }

    initSwiper() {
    // Horizontal Swiper
    const horizontalSwiper = new Swiper(".landingmenuswiper", {
      slidesPerView: 5,
      spaceBetween: 1,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        320: { slidesPerView: 2, spaceBetween: 5 },
        480: { slidesPerView: 3, spaceBetween: 5 },
        575: { slidesPerView: 4, spaceBetween: 5 },
        768: { slidesPerView: 5, spaceBetween: 5 },
        992: { slidesPerView: 6, spaceBetween: 5 },
        1199: { slidesPerView: 8, spaceBetween: 5 },
        1300: { slidesPerView: 9, spaceBetween:  5 },
        1400: { slidesPerView: 10, spaceBetween:  10 },
      },
    });
  
    // Vertical Swiper
    const defaultSwiper = new Swiper(".heroSwiper", {
      slidesPerView: 1, // Number of slides visible at a time
      spaceBetween: 10, // Space between slides
      loop: true, // Infinite scrolling
      autoplay: {
        delay: 2000, // 2 seconds per slide
      },
    });
  }

  hasPositiveValue(match: any): boolean {
    return [match?.team1Back, match?.team1Lay, match?.drawBack, match?.drawLay, match?.team2Back, match?.team2Lay]
      .some(num => num > 0);
  }
  
}
