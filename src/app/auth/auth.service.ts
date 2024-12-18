import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  private username = new BehaviorSubject<string | null>(this.getUsernameFromStorage());
  private userId: string | null = '';

  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, password: string): Observable<{ token: string, user: { id: string, username: string, email: string } }> {
    return this.http.post<{ token: string, user: { id: string, username: string, email: string } }>(`${this.apiUrl}/login`, { username, password }, { withCredentials: true })
    .pipe(
      tap((response: { token: string, user: { id: string, username: string, email: string } }) => {
        this.setToken(response.token);
        localStorage.setItem('userId', response.user.id);
        localStorage.setItem('username', response.user.username);
        this.username.next(response.user.username);
      })
    )
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    this.userId = localStorage.getItem('userId');
    return this.http.put(`${this.apiUrl}/user/${this.userId}/password`, { currentPassword, newPassword });
  }

  changeAvatar(profilePicturePath: string): Observable<any> {
    this.userId = localStorage.getItem('userId');
    return this.http.put(`${this.apiUrl}/user/${this.userId}/avatar`, { profilePicturePath });
  }

  logout(): void {
    localStorage.clear();
    this.loggedIn.next(false);
    this.router.navigate(['/']);
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.loggedIn.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsername(): Observable<string | null> {
    return this.username.asObservable();
  }

  private getUsernameFromStorage(): string | null {
    return localStorage.getItem('username');
  }
}
