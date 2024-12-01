import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatCardModule,
    MatListModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  profile = {
    profilePicture: `../../assets/profile-picture/ProfilePicture.png`,
    username: 'pecodigos',
    ladderRank: `#1`,
    fighterRank: `SAIYAN`,
    level: `31 (55740 XP)`,
    ratio: `10 - 0 (+10)`,
    siteRank: `Admin`,
    registerOn: `28/11/2024`
  }
}
