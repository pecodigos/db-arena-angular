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
import { ClassesMapper } from '../mapper/classes-mapper.service';
import { Skill } from '../interfaces/skill.interface';
import { TurnAction } from '../interfaces/turn-action.interface';

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
  selectedFighter: Fighter | null = null;
  selectedSkill: Skill | null = null;

  viewMode: ViewMode | null = null;

  team: Fighter[] = [];
  opponentTeam: Fighter[] = [];
  possibleTargets: Fighter[] = [];

  private actions: TurnAction[] = [];
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
    public costService: CostService
  ) {}

  ngOnInit(): void {
    if (!this.authService.hasToken()) {
      this.authService.logout();
      return;
    }

    const username = localStorage.getItem('username');
    if (username) {
      this.profileService.getPublicProfile(username).subscribe({
        next: (data) => {
          (this.profile = data),
          this.cdr.detectChanges();
        },
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

        this.team = isPlayerOne
          ? this.mapFighters(this.match.playerOne.team)
          : this.mapFighters(this.match.playerTwo.team);

        this.opponentTeam = isPlayerOne
          ? this.mapFighters(this.match.playerTwo.team)
          : this.mapFighters(this.match.playerOne.team);


        this.cdr.detectChanges();
      } else {
        console.warn('Invalid match data', response);
      }
    };
    this.webSocketService.onMatch(this.matchCallback);
  }

  private mapFighters(fighters: any[]): Fighter[] {
    return fighters.map(fighter => {
      console.log('Processing fighter:', fighter);

      const mappedSkills = (fighter.skills || []).map((skill: { ability: any; }) => {
        if (!skill || !skill.ability) {
          console.warn('Invalid skill or ability:', skill);
          return skill;
        }
        const mappedAbility = this.classesMapper.mapToClasses(skill.ability);
        console.log('Mapped ability:', mappedAbility);
        return {
          ...skill,
          ability: mappedAbility,
        };
      });

      console.log('Mapped skills:', mappedSkills);

      return {
        ...fighter,
        skills: mappedSkills,
      };
    });
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

  selectFighter(fighter: Fighter) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedFighter = fighter;
    this.selectedSkill = null;
    this.selectedProfile = null;
    this.viewMode = ViewMode.CHARACTER;
    console.log('Fighter skills:', fighter.skills);
  }

  showSkillDetails(skill: Skill) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedSkill = skill;
    this.viewMode = ViewMode.ABILITY;
  }

  backToCharacterDetails() {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedSkill = null;
    this.viewMode = ViewMode.CHARACTER;
  }

  selectProfile(profile: any) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);

    this.selectedProfile = profile;
    this.selectedFighter = null;
    this.selectedSkill = null;
    this.viewMode = ViewMode.PROFILE;
  }

  selectTarget(target: Fighter): void {
    if (!this.selectedSkill || !this.selectedFighter) return;

    const characterIndex = this.team.findIndex(fighter => fighter === this.selectedFighter);
    const skillIndex = this.selectedFighter.skills.findIndex(skill => skill === this.selectedSkill);
    const targetIndex = this.possibleTargets.findIndex(fighter => fighter === target);

    if (characterIndex === -1 || skillIndex === -1 || targetIndex === -1) return;

    this.actions.push({
      characterIndex: characterIndex,
      skillIndex: skillIndex,
      targetIndexes: [targetIndex],
    });

    this.selectedSkill = null;
    this.possibleTargets = [];
  }

  selectOpponentProfile(opponent: any) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedProfile = opponent;
    this.selectedFighter = null;
    this.selectedSkill = null;
    this.viewMode = ViewMode.PROFILE;
  }
}
