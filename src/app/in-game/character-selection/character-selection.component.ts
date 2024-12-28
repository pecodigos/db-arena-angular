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
import { Fighter } from '../interfaces/fighter.model';

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
  draggedCharacterIndex: number | null = null;
  selectedMode: any = null;
  animateSkillContainer: boolean = false;
  isOnOriginalPosition: boolean = true;

  clickSoundPath: string = 'assets/sounds/click.mp3';
  searchingSoundPath: string = 'assets/sounds/searching.mp3';
  stopSearchSoundPath: string = 'assets/sounds/close-search.mp3';
  matchFoundSoundPath: string = 'assets/sounds/foundmatch.mp3';

  viewMode: ViewMode = ViewMode.CHARACTER;

  currentPage = 0;
  charactersPerPage = 21;

  currentTeam: Fighter[] = Array.from({ length: 3 }, () => new Fighter());

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
          this.webSocketService.searchForMatch(this.currentTeam);
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

    const team = this.currentTeam;

    if (team.some(slot => !slot.character)) {
      console.error('Team is not complete!');
      return;
    }

    localStorage.setItem('team', JSON.stringify(team));

    this.playSoundService.playLoopSound(this.searchingSoundPath);
    this.selectedMode = selectedMode;
    this.viewMode = ViewMode.SEARCHING;

    if (!this.webSocketService.isConnected()) {
      this.webSocketService.connect();
    }

    this.webSocketService.searchForMatch(team);
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
    }, 5000);
  }

  handleMatchFound(matchDetails: any): void {
    console.log('Match found:', matchDetails);
    this.matchFound();
  }

  onDragStarted(event: any, character: Character) {
    const element = event.source.element.nativeElement;
    this.renderer.addClass(element, 'dragging');
    this.renderer.setStyle(element, 'position', 'initial');

    const slotIndex = this.currentTeam.findIndex(slot => slot.character === character);
    if (slotIndex !== -1) {
      this.currentTeam[slotIndex].character = null;
    }

    this.selectedCharacter = character;
  }

  onCharacterReleased(event: any, character: Character) {
    const element = event.source.element.nativeElement;
    this.renderer.removeClass(element, 'dragging');

    const dropResult = this.findDropZone(event);

    if (dropResult.valid && dropResult.rect) {
      const dropRect = dropResult.rect;
      const targetX = dropRect.left;
      const targetY = dropRect.top;

      this.renderer.setStyle(element, 'position', 'absolute');
      this.renderer.setStyle(element, 'left', `${targetX}px`);
      this.renderer.setStyle(element, 'top', `${targetY}px`);
      this.renderer.setStyle(element, 'margin', '0');
      this.renderer.setStyle(element, 'transform', 'none');

      this.currentTeam[dropResult.slotIndex].character = character;
    } else {
      event.source._dragRef.reset();
      this.renderer.removeStyle(element, 'position');
      this.renderer.removeStyle(element, 'left');
      this.renderer.removeStyle(element, 'top');
      this.renderer.removeStyle(element, 'margin');
    }
  }

  private findDropZone(event: any): { valid: boolean; slotIndex: number; rect?: DOMRect } {
    const element = event.source.element.nativeElement;
    const dragRect = element.getBoundingClientRect();
    const dropZones = document.querySelectorAll('.team');

    const dragCenterX = dragRect.left + dragRect.width / 2;
    const dragCenterY = dragRect.top + dragRect.height / 2;

    for (let i = 0; i < dropZones.length; i++) {
      const dropZone = dropZones[i] as HTMLElement;
      const dropRect = dropZone.getBoundingClientRect();

      const rangeBuffer = 20;
      const expandedRect = {
        left: dropRect.left - rangeBuffer,
        right: dropRect.right + rangeBuffer,
        top: dropRect.top - rangeBuffer,
        bottom: dropRect.bottom + rangeBuffer
      };

      if (
        dragCenterX >= expandedRect.left &&
        dragCenterX <= expandedRect.right &&
        dragCenterY >= expandedRect.top &&
        dragCenterY <= expandedRect.bottom
      ) {
        return { valid: true, slotIndex: i, rect: dropRect };
      }
    }

    return { valid: false, slotIndex: -1 };
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

  isCharacterInTeamSlot(character: Character): boolean {
    return this.currentTeam.some(slot => slot.character?.id === character.id);
  }

  isCharacterBeingDragged(character: Character): boolean {
    return character === this.selectedCharacter && this.draggedCharacterIndex !== null;
  }
}
