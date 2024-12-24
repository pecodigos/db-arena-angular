import { AuthService } from './../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, Renderer2 } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PreventDragDirective } from '../../prevent-drag/prevent-drag.directive';
import { ProfileService } from '../../profile/profile.service';
import { CharacterSelectionService } from './character-selection.service';
import { Character } from '../interfaces/character.interface';
import { Ability } from '../interfaces/ability.interface';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PlaySoundService } from '../../sounds/play-sound.service';
import { WebsocketService } from '../../websocket/websocket.service';
import { ViewMode } from '../enums/view-mode.enum';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatchResponse } from '../interfaces/match-response.interface';

@Component({
  selector: 'app-character-selection',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    CommonModule,
    PreventDragDirective,
    DragDropModule
  ],
  templateUrl: './character-selection.component.html',
  styleUrl: './character-selection.component.scss'
})
export class CharacterSelectionComponent implements OnInit {
  profile: any = null;
  characters: Character[] = [];
  selectedCharacter: Character | null = null;
  selectedAbility: Ability | null = null;
  selectedMode: any = null;
  animateSkillContainer: boolean = false;

  clickSoundPath: string = 'assets/sounds/click.mp3';
  searchingSoundPath: string = 'assets/sounds/searching.mp3';
  stopSearchSoundPath: string = 'assets/sounds/close-search.mp3';
  matchFoundSoundPath: string = 'assets/sounds/foundmatch.mp3';

  viewMode: ViewMode = ViewMode.CHARACTER;

  currentPage = 0;
  charactersPerPage = 21;

  team = Array.from({ length: 3 }, () => ({
    id: null as number | null,
    imagePath: 'https://i.imgur.com/9VwrLXz.png'
  }));

  costs = [
    { energyType: "COMBAT", imagePath: `assets/etc/green.png` },
    { energyType: "BLOODLINE", imagePath: `assets/etc/red.png` },
    { energyType: "KI", imagePath: `assets/etc/blue.png` },
    { energyType: "TECHNIQUE", imagePath: `assets/etc/white.png` },
    { energyType: "ANY", imagePath: `assets/etc/black.png` },
  ];

  private wsSubscription: Subscription | null = null;
  private matchCallback: ((message: any) => void) | null = null;

  constructor(
      private renderer: Renderer2,
      private profileService: ProfileService,
      private characterService: CharacterSelectionService,
      private authService: AuthService,
      private playSoundService: PlaySoundService,
      private webSocketService: WebsocketService,
      private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.hasToken()) {
      this.authService.logout();
      return;
    }

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

    this.wsSubscription = this.webSocketService.connectionStatus$.subscribe(
      connected => {
        if (connected && this.viewMode === ViewMode.SEARCHING) {
          console.log('WebSocket reconnected while searching, resuming search...');
          this.webSocketService.searchForMatch();
        }
      }
    );

    this.matchCallback = (matchDetails: MatchResponse) => {
      this.handleMatchFound(matchDetails);
    };

    this.webSocketService.onMatch(this.matchCallback);
  }

  startSearching(selectedMode: any): void {
    if (!this.authService.hasToken()) {
      this.authService.logout();
      return;
    }

    console.log('Starting search for mode:', selectedMode);
    this.playSoundService.playLoopSound(this.searchingSoundPath);
    this.selectedMode = selectedMode;
    this.viewMode = ViewMode.SEARCHING;

    if (!this.webSocketService.isConnected()) {
      this.webSocketService.connect();
    }

    this.webSocketService.searchForMatch();
  }

  stopSearching(): void {
    this.playSoundService.playSound(this.stopSearchSoundPath);
    this.selectedMode = null;
    this.viewMode = ViewMode.CHARACTER;
    this.webSocketService.disconnect();
  }

  matchFound(): void {
    this.playSoundService.playSound(this.matchFoundSoundPath);
    this.selectedMode = null;
    this.viewMode = ViewMode.CHARACTER;
    setTimeout(() => {
      this.router.navigate(['/battle']);
    }, 10000);
  }

  handleMatchFound(matchDetails: any): void {
    console.log('Match found:', matchDetails);
    this.matchFound();
  }

  onDragStarted(event: any) {
    this.renderer.setStyle(event.source.element.nativeElement, 'transform', 'none');
    event.source.reset();
  }

  onCharacterReleased(event: any) {
    const validDrop = this.isDroppedInValidSlot(event);

    if (!validDrop) {
      this.renderer.setStyle(event.source.element.nativeElement, 'transform', 'translate3d(0px, 0px, 0px)');
    }
  }

  isDroppedInValidSlot(event: any): boolean {
    const dropZones = document.querySelectorAll('[cdkDropList]');
    const dragRect = event.source.element.nativeElement.getBoundingClientRect();

    for (const dropZone of Array.from(dropZones)) {
      const dropRect = dropZone.getBoundingClientRect();

      if (
        dragRect.left < dropRect.right &&
        dragRect.right > dropRect.left &&
        dragRect.top < dropRect.bottom &&
        dragRect.bottom > dropRect.top
      ) {
        return true;
      }
    }
    return false;
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

  get visibleCharacters() {
    const startIndex = this.currentPage * this.charactersPerPage;
    const endIndex = startIndex + this.charactersPerPage;
    return this.characters.slice(startIndex, endIndex);
  }

  nextPage() {
    const totalPages = Math.ceil(this.characters.length / this.charactersPerPage);

    if (this.currentPage + 1 < totalPages) {
      this.currentPage++;
    } else {
      this.currentPage = 0;
    }
  }

  previousPage() {
    const totalPages = Math.ceil(this.characters.length / this.charactersPerPage);
    if (this.currentPage > 0) {
      this.currentPage--;
    } else {
      this.currentPage = totalPages - 1
    }
  }

  selectCharacter(character: Character) {
    this.animateSkillContainer = false;
    setTimeout(() => {
      this.playSoundService.playSound(this.clickSoundPath);
      this.selectedCharacter = character;
      this.selectedAbility = null;
      this.viewMode = ViewMode.CHARACTER;
      this.animateSkillContainer = true;
    }, 10);
  }

  showAbilityDetails(ability: Ability) {
    this.playSoundService.playSound(this.clickSoundPath);
    this.selectedAbility = ability;
    this.viewMode = ViewMode.ABILITY;
  }

  backToCharacterDetails() {
    this.playSoundService.playSound(this.clickSoundPath);
    this.selectedAbility = null;
    this.viewMode = ViewMode.CHARACTER;
  }

  closeContainer() {
    this.selectedCharacter = null;
  }

  getArray(amount: number): number[] {
    return amount > 0 ? Array.from({ length: amount }) : [];
  }

  onLogout() {
    this.authService.logout();
  }

  startQuickGame() {
    window.location.href = "/battle";
  }
}
