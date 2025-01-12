import { Ability } from './../interfaces/ability.interface';
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
import { SoundService } from '../sounds/sound.service';
import { PlaySoundService } from '../../sounds/play-sound.service';
import { ViewMode } from '../enums/view-mode.enum';
import { CostService } from '../cost/cost.service';
import { Character } from '../interfaces/character.interface';
import { ClassesMapper } from '../mapper/classes-mapper.service';
import { TurnService } from './turn.service';

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

  selectedProfile: any = null;
  selectedCharacter: Character | null = null;
  selectedAbility: any = null;

  viewMode: ViewMode | null = null;
  isMyTurn = false;
  exchangeEnergy = false;

  team: (Fighter | null)[] = Array.from({ length: 3 }, () => null);
  opponentTeam: (Fighter | null)[] = Array.from({ length: 3 }, () => null );

  private timerSubscription: Subscription | null = null;
  private wsSubscription: Subscription | null = null;
  private matchCallback: ((message: any) => void) | null = null;

  constructor(
    private profileService: ProfileService,
    private webSocketService: WebsocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private soundService: SoundService,
    private playSoundService: PlaySoundService,
    private classesMapper: ClassesMapper,
    public costService: CostService,
    public turnService: TurnService
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
        this.setupMatchSubscription();

        this.webSocketService.getMatchDetails();
      }
    });

    if (!this.webSocketService.isConnected()) {
      this.webSocketService.connect();
    } else {
      this.setupMatchSubscription();
      this.webSocketService.getMatchDetails();
    }
  }

  private setupMatchSubscription(): void {
    this.matchCallback = (response: MatchResponse) => {
      if (response) {
        this.match = response.match;
        const currentUsername = localStorage.getItem('username');

        const isPlayerOne = this.match.playerOne.userProfile.username === currentUsername;

        this.opponent = isPlayerOne ? this.match.playerTwo.userProfile : this.match.playerOne.userProfile;

        this.isMyTurn = isPlayerOne ? this.match.playerOne.currentTurn : this.match.playerTwo.currentTurn;

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

  selectCharacter(character: Character) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedCharacter = character;
    this.selectedAbility = null;
    this.selectedProfile = null;
    this.viewMode = ViewMode.CHARACTER;
  }

  showAbilityDetails(ability: Ability) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedAbility = {
      ...ability,
      classes: this.classesMapper.mapToClasses(ability),
    };
    this.viewMode = ViewMode.ABILITY;
    this.selectedCharacter = null;
    this.selectedProfile = null;
  }

  backToCharacterDetails() {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedAbility = null;
    this.viewMode = ViewMode.CHARACTER;
  }

  selectProfile(profile: any) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedProfile = profile;
    this.selectedCharacter = null;
    this.selectedAbility = null;
    this.viewMode = ViewMode.PROFILE;
  }

  selectOpponentProfile(opponent: any) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedProfile = opponent;
    this.selectedCharacter = null;
    this.selectedAbility = null;
    this.viewMode = ViewMode.PROFILE;
  }

  openExchangeEnergy(): void {
    this.exchangeEnergy = true;
  }

  closeExchangeEnergy(): void {
    this.exchangeEnergy = false;
  }
}
