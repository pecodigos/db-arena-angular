import { Routes } from '@angular/router';
import { GameManualComponent } from './game-manual/game-manual.component';
import { HomeComponent } from './home/home.component';
import { MissionsComponent } from './missions/missions.component';
import { InGameComponent } from './in-game/in-game.component';
import { SettingsComponent } from './settings/settings.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'game-manual', component: GameManualComponent },
  { path: 'missions', component: MissionsComponent },
  { path: 'in-game', component: InGameComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'leaderboards', component: LeaderboardComponent },
  { path: 'profile', component: ProfileComponent },
];
