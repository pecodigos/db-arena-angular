import { Routes } from '@angular/router';
import { GameManualComponent } from './game-manual/game-manual.component';
import { HomeComponent } from './home/home.component';
import { MissionsComponent } from './missions/missions.component';
import { InGameComponent } from './in-game/in-game.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'game-manual', component: GameManualComponent },
  { path: 'missions', component: MissionsComponent },
  { path: 'in-game', component: InGameComponent },
];
