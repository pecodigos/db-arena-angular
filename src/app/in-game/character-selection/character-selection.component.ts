import { AuthService } from './../../auth/auth.service';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PreventDragDirective } from '../../prevent-drag.directive';
import { ProfileService } from '../../profile/profile.service';
import { CharacterSelectionService } from './character-selection.service';
import { Character } from '../models/character.model';
import { Ability } from '../models/ability.model';

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
  characters: Character[] = [];

  currentPage = 0;
  charactersPerPage = 21;
  charactersPerTeam = 3;

  selectedCharacter: Character | null = null;
  selectedAbility: Ability | null = null;
  viewMode: 'character' | 'ability' = 'character';

costs = [
  { energyType: "COMBAT", imagePath: `assets/etc/green.png` },
  { energyType: "BLOODLINE", imagePath: `assets/etc/red.png` },
  { energyType: "KI", imagePath: `assets/etc/blue.png` },
  { energyType: "TECHNIQUE", imagePath: `assets/etc/white.png` },
  { energyType: "ANY", imagePath: `assets/etc/black.png` },
];

  profile: any = null;
  originalPositions: { [key: number]: DOMRect } = {};

  constructor(private profileService: ProfileService,
      private characterService: CharacterSelectionService,
      private authService: AuthService
  ) {}

  ngOnInit(): void {
    const username = localStorage.getItem('username');

    if (username) {
      this.profileService.getPublicProfile(username).subscribe({
        next: (data) => (this.profile = data),
        error: (err) => console.error('Failed to fetch profile', err),
      });
    }

    this.characterService.getAllCharacters().subscribe({
      next: (data) => {
        this.characters = data.map((character: Character) => ({
          ...character,
          abilities: character.abilities.map((ability: Ability) => ({
            ...ability,
            classes: this.mapToClasses(ability),
          })),
        }));
      },
      error: (err) => console.error('Failed to fetch characters', err),
    });
  }

  mapToClasses(ability: any): string[] {
    return [
      ability.skillType,
      ability.distance,
      ability.persistentType
    ].filter((value: string) => value && value !== "NONE");
  }

  getEnergyImage(energyType: string): string {
    const cost = this.costs.find(c => c.energyType === energyType);
    return cost ? cost.imagePath : '';
  }

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
    this.selectedAbility = null;
    this.viewMode = 'character';
  }

  showAbilityDetails(ability: Ability) {
    this.selectedAbility = ability;
    this.viewMode = 'ability';
  }

  backToCharacterDetails() {
    this.selectedAbility = null;
    this.viewMode = 'character';
  }

  closeContainer() {
    this.selectedCharacter = null;
  }

  getArray(amount: number): number[] {
    return Array.from({ length: amount });
  }

  onLogout() {
    this.authService.logout();
  }
}
