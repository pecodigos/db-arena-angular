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
  characters = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: `Character ${i + 1}`,
    description: `Description for Character${i + 1}`,
    image: `../../../assets/characters/Character1.png`,
        skills: [
      {
        name: `Basic Combo`,
        description: `Goku strikes several punches at the enemy, dealing 20 damage and making them deal 10 less damage next turn. This skill becomes 'Kaioken Attack' when 'Kaioken' is used.`,
        image: `../../../assets/characters/early-goku/skill1.png`
      },
      {
        name: `Kamehameha`,
        description: `Goku uses his Kamehameha, dealing 30 piercing damage to one enemy. This skill becomes 'Kamehameha: Kaioken x3' when 'Kaioken' is active.`,
        image: `../../../assets/characters/early-goku/skill2.png`
      },
      {
        name: `Kaioken`,
        description: `Goku unleashes his power. He will gain 25% damage reduction, and have improved skills.`,
        image: `../../../assets/characters/early-goku/skill3.png`
      },
      {
        name: `Block`,
        description: `Goku becomes invulnerable for one turn.`,
        image: `../../../assets/characters/early-goku/skill4.png`
      },
    ]
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

  selectedCharacter: any = null;
  selectedSkill: any = null;
  viewMode: 'character' | 'skill' = 'character';

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

    if (this.currentPage == 2) {
      this.currentPage = 0;
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    } else if (this.currentPage == -1) {
      this.currentPage = 1;
    }
  }

  selectCharacter(character: any) {
    this.selectedCharacter = character;
    this.selectedSkill = null;
    this.viewMode = 'character';
  }

  showSkillDetails(skill: any) {
    this.selectedSkill = skill;
    this.viewMode = 'skill';
  }

  backToCharacterDetails() {
    this.selectedSkill = null;
    this.viewMode = 'character';
  }
}
