import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: 'root'
})
export class BettingService {

  private apiUrl = `${environment.base_url}betting`;

  constructor(private http: HttpClient) {}

  // Fetch landing-data
  getLandingData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/landing-data`);
  }

  // Fetch live matches
  getLiveMatches(): Observable<any> {
    return this.http.get(`${this.apiUrl}/liveMatches`);
  }

  // Fetch upcoming events
  getUpcomingEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/upcomingEvents`);
  }

  // Fetch match odds based on sportId & matchId
  getMatchOdds(sportId: string, matchId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/matchOdds/${sportId}/${matchId}`);
  }

  // Place a bet
  placeBet(betData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/place-bet`, betData);
  }

   // Cancel a bet
   cancelBet(betId: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cancel-bet/${betId}`);
  }

  // Gets current bets
  currentBets(matchId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/current-bets/${matchId}`);
  }

  // Gets Matched bet history
  getbetHistory(queryParams: { [key: string]: string | number }): Observable<any> {
    let params = new HttpParams();

    // Append query parameters
    Object.keys(queryParams).forEach(key => {
      params = params.append(key, queryParams[key].toString());
    });

    return this.http.get(`${this.apiUrl}/bet-history`, { params });
  }
  
  // Gets Matched bet history
  getuserBets(queryParams: { [key: string]: string | number }): Observable<any> {
    let params = new HttpParams();

    // Append query parameters
    Object.keys(queryParams).forEach(key => {
      params = params.append(key, queryParams[key].toString());
    });

    return this.http.get(`${this.apiUrl}/user-bets`, { params });
  }
   getAnnouoncement() {
    return this.http.get(`${this.apiUrl}/getActiveBanners`)
  }
}
