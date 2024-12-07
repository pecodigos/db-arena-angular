import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PreventDragDirective } from '../../prevent-drag.directive';
import { ProfileComponent } from '../../profile/profile.component';
import { BehaviorSubject } from 'rxjs';
import { ProfileService } from '../../profile/profile.service';

@Component({
  selector: 'app-character-selection',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    CommonModule,
    PreventDragDirective,
  ],
  templateUrl: './character-selection.component.html',
  styleUrl: './character-selection.component.scss'
})
export class CharacterSelectionComponent implements OnInit {
  currentPage = 0;
  charactersPerPage = 21;
  charactersPerTeam = 3;

  selectedCharacter: any = null;
  selectedSkill: any = null;
  viewMode: 'character' | 'skill' = 'character';

  names = [ '', 'Goku', 'Vegeta', 'Kuririn', 'Piccolo', 'Yamcha', 'Tenshinhan', 'Chiatzu', 'Nappa', 'Frieza', 'Cell', 'Majin Buu', 'Trunks', 'Goten', 'Master Roshi', 'Raditz', 'Bulma', 'Chichi', 'Gohan', 'Android 17', 'Android 18', 'Mr. Satan' ];

  descriptions = ['', 'The cheerful and determined Saiyan warrior, known for his love of fighting, immense strength, and quest to protect Earth.',
     'The proud Saiyan prince, fiercely competitive and always striving to surpass Goku in strength and power.',
    "Goku's loyal friend and skilled martial artist, often underestimated but always courageous in battle.",
    "The wise and stoic Namekian warrior, once an enemy of Goku, now a mentor and protector of Earth.",
    "A former desert bandit turned martial artist, known for his loyalty and humor, despite often being outmatched.",
    "A disciplined and serious martial artist with incredible focus and powerful techniques like the Tri-Beam.",
    "Tenshinhan's loyal companion, small in size but brave, with psychic powers and a kind heart.",
    "A brutal and powerful Saiyan warrior, Vegeta's former comrade, known for his destructive nature.",
    "The ruthless galactic tyrant with immense power and multiple transformations, a major antagonist to Goku and Vegeta.",
    "A bio-engineered android who absorbs others to achieve perfection, cunning and deadly in his quest for supremacy.",
    "A chaotic and unpredictable being with immense strength, capable of devastating destruction and regeneration.",
    "The time-traveling half-Saiyan warrior, brave and skilled, fighting to save his future from despair.",
    "Goku's cheerful and energetic youngest son, sharing his father's strength and love for fighting.",
    "The wise yet pervy martial arts master, trainer of Goku and others, known for his iconic Kamehameha.",
    "Goku's older brother, a ruthless Saiyan warrior who brings Goku's Saiyan heritage to light.",
    "The brilliant scientist and inventor, known for her resourcefulness, wit, and contributions to the Z Fighters.",
    "Goku's strong-willed wife, caring mother to Gohan and Goten, often seen as strict but loving.",
    "Goku's eldest son, a gentle soul with immense hidden power, rising to protect his loved ones when needed.",
    "The calm and confident android with great strength and a sense of freedom, later a key ally to the Z Fighters.",
    "A cool and independent android, deadly in combat but caring, especially as Krillin's wife and a loving mother.",
    "The self-proclaimed 'World Martial Arts Champion', comedic and cowardly but with a big heart in crucial moments."
  ]


  profile: any = null;

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    const username = localStorage.getItem('username');

    if (username) {
      this.profileService.getPublicProfile(username).subscribe({
        next: (data) => (this.profile = data),
        error: (err) => console.error('Failed to fetch profile', err),
      });
    }
  }

  characters = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    name: this.names.at(i + 1),
    description: this.descriptions.at(i + 1),
    image: `../../../assets/characters/Character${i + 1}.png`,

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

  get teamCharacters() {
    return this.team;
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

  closeContainer() {
    this.selectedCharacter = null;
  }
}
