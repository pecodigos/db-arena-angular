import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-character-selection',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    CommonModule,
  ],
  templateUrl: './character-selection.component.html',
  styleUrl: './character-selection.component.scss'
})
export class CharacterSelectionComponent {
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
    username: `pecodigos`,
    clan: `Kobrasol`,
    level: `31`,
    fighterRank: `Saiyan`,
    ladderRank: `1`,
    ratio: `10/0`,
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
