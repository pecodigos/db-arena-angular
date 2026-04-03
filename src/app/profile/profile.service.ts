import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PublicProfile } from '../in-game/interfaces/public-profile.interface';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiBaseUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getPublicProfile(username: string): Observable<PublicProfile> {
    return this.http.get<PublicProfile>(`${this.apiUrl}/profile/${username}`);
  }
}
