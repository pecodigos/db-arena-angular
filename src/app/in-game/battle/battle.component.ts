import { ProfileService } from './../../profile/profile.service';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PreventDragDirective } from '../../prevent-drag/prevent-drag.directive';
import { WebsocketService } from '../../websocket/websocket.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatchResponse } from '../interfaces/match-response.interface';
import { interval, Subscription } from 'rxjs';
import { Fighter } from '../interfaces/fighter.model';

@Component({
  selector: 'app-battle',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    PreventDragDirective,
    MatProgressBarModule,
    CommonModule,
  ],
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.scss'
})
export class BattleComponent implements OnInit, OnDestroy {
  profile: any = null;
  opponent: any = null;
  progressValue = 100;
  match: any = null;

  team: (Fighter | null)[] = Array.from({ length: 3 }, () => null);
  opponentTeam: (Fighter | null)[] = Array.from({ length: 3 }, () => null );

  private timerSubscription: Subscription | null = null;
  private wsSubscription: Subscription | null = null;
  private matchCallback: ((message: any) => void) | null = null;

  constructor(
    private profileService: ProfileService,
    private webSocketService: WebsocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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

    this.setupWebSocketConnection();
    this.startTimer();
  }

  private setupWebSocketConnection(): void {
    this.wsSubscription = this.webSocketService.connectionStatus$.subscribe((connected) => {
      if (connected) {
        console.log('WebSocket connected, setting up match subscription');
        this.setupMatchSubscription();

        this.webSocketService.getMatchDetails();
      }
    });

    if (!this.webSocketService.isConnected()) {
      console.log('WebSocket is not connected, connecting now...');
      this.webSocketService.connect();
    } else {
      this.setupMatchSubscription();
      this.webSocketService.getMatchDetails();
    }
  }

  private setupMatchSubscription(): void {
    console.log('Setting up match subscription');
    this.matchCallback = (response: MatchResponse) => {
      console.log('Received match data in battle component:', response);
      if (response) {
        this.match = response.match;
        const currentUsername = localStorage.getItem('username');

        const isPlayerOne = this.match.playerOne.userProfile.username === currentUsername;

        this.opponent = isPlayerOne ? this.match.playerTwo.userProfile : this.match.playerOne.userProfile;

        this.team = isPlayerOne ? [ ... this.match.playerOne.team ] : [ ... this.match.playerTwo.team ];
        this.opponentTeam = isPlayerOne ? [ ... this.match.playerTwo.team ] : [ ... this.match.playerOne.team ];

        this.cdr.detectChanges();
      } else {
        console.warn('Invalid match data', response);
      }
    };
    this.webSocketService.onMatch(this.matchCallback);
  }

  startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.progressValue > 0) {
        this.progressValue -= 2;
      } else if (this.timerSubscription) {
        this.timerSubscription.unsubscribe();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }

    if (this.matchCallback) {
      this.webSocketService.removeMatchCallback(this.matchCallback);
    }
  }
}
