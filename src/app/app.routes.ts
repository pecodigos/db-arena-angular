import { Routes } from '@angular/router';
import { GameManualComponent } from './game-manual/game-manual.component';
import { HomeComponent } from './home/home.component';
import { MissionsComponent } from './missions/missions.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { ProfileComponent } from './profile/profile.component';
import { CharacterSelectionComponent } from './in-game/character-selection/character-selection.component';
import { BattleComponent } from './in-game/battle/battle.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { CharactersComponent } from './game-manual/characters/characters.component';
import { RulingComponent } from './game-manual/ruling/ruling.component';
import { LadderSystemComponent } from './game-manual/ladder-system/ladder-system.component';
import { ChangeAvatarComponent } from './change-avatar/change-avatar.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  { path: 'game-manual', component: GameManualComponent },
  { path: 'game-manual/fighters', component: CharactersComponent },
  { path: 'game-manual/basics', component: RulingComponent },
  { path: 'game-manual/ladder-system', component: LadderSystemComponent },

  { path: 'missions', component: MissionsComponent },

  { path: 'change-avatar', component: ChangeAvatarComponent},
  { path: 'change-password', component: ChangePasswordComponent },

  { path: 'leaderboards', component: LeaderboardComponent },
  { path: 'profile', component: ProfileComponent },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'character-selection', component: CharacterSelectionComponent },
  { path: 'battle', component: BattleComponent },
];
