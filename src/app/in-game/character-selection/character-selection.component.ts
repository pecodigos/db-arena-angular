import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PreventDragDirective } from '../../prevent-drag.directive';

@Component({
  selector: 'app-character-selection',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    CommonModule,
    PreventDragDirective
  ],
  templateUrl: './character-selection.component.html',
  styleUrl: './character-selection.component.scss'
})
export class CharacterSelectionComponent {
  clouds = [
    { top: 10, left: -20, speed: 30 },
    { top: 50, left: -10, speed: 40 },
    { top: 70, left: -30, speed: 50},
  ];

  characters = Array.from({ length: 63 }, (_, i) => ({
    id: i + 1,
    name: `Character ${i + 1}`,
    image: `../../../assets/characters/Character1.png`
  }));

  team = Array.from({ length: 3 }, (_,i) => ({
    id: i + 1,
    image: `../../../assets/characters/Character${i + 1}.png`
  }));

  profile = {
    image: `../../../assets/profile-picture/ProfilePicture.png`,
    username: `PECODIGOS`,
    clan: `KOBRASOL`,
    level: `31`,
    fighterRank: `SAIYAN`,
    ladderRank: `1`,
    ratio: `10 - 0`,
    name: `profile picture`,
  }

  currentPage = 0;
  charactersPerPage = 21;
  charactersPerTeam = 3;

  get teamCharacters() {
    return this.team;
  }

  get profilePicture() {
    return this.profile.image;
  }

  get visibleCharacters() {
    const startIndex = this.currentPage * this.charactersPerPage;
    const endIndex = startIndex + this.charactersPerPage;
    return this.characters.slice(startIndex, endIndex);
  }

  nextPage() {
    if ((this.currentPage + 1) * this.charactersPerPage < this.characters.length) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }
}
