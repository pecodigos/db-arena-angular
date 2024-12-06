import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatCardModule,
    MatListModule,
    CommonModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private publicProfileUrl = 'http://localhost:8080/api/users';
  private username: string | null = localStorage.getItem('username');

  profile$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.username) {
      this.getPublicProfile(this.username).subscribe({
        next: (profile) => this.profile$.next(profile),
        error: (err) => console.error('Error fetching profile:', err)
      });
    }
  }

  getPublicProfile(username: string) {
    return this.http.get(`${this.publicProfileUrl}/profile/${username}`);
  }
}
