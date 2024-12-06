import { ProfileService } from './profile.service';
import { Component, Input, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { BehaviorSubject } from 'rxjs';
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
  private username = localStorage.getItem('username');
  profile$ = new BehaviorSubject<any>(null);

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    if (this.username) {
      this.profileService.getPublicProfile(this.username).subscribe({
        next: (profile) => this.profile$.next(profile),
        error: (err) => console.error('Error fetching profile:', err)
      });
    }
  }
}
