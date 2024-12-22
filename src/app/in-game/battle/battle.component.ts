import { ProfileService } from './../../profile/profile.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PreventDragDirective } from '../../prevent-drag/prevent-drag.directive';
import { WebsocketService } from '../../websocket/websocket.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-battle',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    PreventDragDirective,
    MatProgressBarModule
  ],
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.scss'
})
export class BattleComponent implements OnInit, OnDestroy {
  profile: any = null;
  opponent: any = null;
  progressValue = 100;
  timerInterval: any;

  constructor(
    private profileService: ProfileService,
    private webSocketService: WebsocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.hasToken()) {
      this.authService.logout();
      return;
    }

    const username = localStorage.getItem('username');

    if (username) {
      this.profileService.getPublicProfile(username).subscribe({
        next: (data) => (this.profile = data),
        error: (err) => console.error('Failed to fetch profile', err),
      });
    }

    this.webSocketService.onMatch((matchData) => {
      this.opponent = matchData;
    });

    this.webSocketService.connect();
    this.startTimer();
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.progressValue > 0) {
        this.progressValue = this.progressValue - 2;
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
