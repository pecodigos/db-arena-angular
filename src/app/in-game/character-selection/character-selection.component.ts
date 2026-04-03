import { CostService } from './../cost/cost.service';
import { AuthService } from './../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
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
import { SoundService } from '../sounds/sound.service';
import { ClassesMapper } from '../mapper/classes-mapper.service';
import { BattleQueueType } from '../enums/battle-queue-type.enum';
import { PublicProfile } from '../interfaces/public-profile.interface';

@Component({
  selector: 'app-character-selection',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    CommonModule,
    PreventDragDirective,
    DragDropModule,
  ],
  templateUrl: './character-selection.component.html',
  styleUrl: './character-selection.component.scss',
})
export class CharacterSelectionComponent implements OnInit, OnDestroy {
  profile: PublicProfile | null = null;
  characters: Character[] = [];
  selectedCharacter: Character | null = null;
  selectedAbility: Ability | null = null;
  draggedCharacterIndex: number | null = null;
  selectedMode: BattleQueueType | null = null;
  animateSkillContainer: boolean = false;
  isOnOriginalPosition: boolean = true;

  viewMode: ViewMode | null = ViewMode.CHARACTER;
  BattleQueueType = BattleQueueType;

  currentPage = 0;
  charactersPerPage = 21;
  searchStatusMessage = '';
  matchErrorMessage = '';

  currentTeam: Fighter[] = Array.from({ length: 3 }, () => new Fighter());

  private wsSubscription: Subscription | null = null;
  private matchCallback: ((message: MatchResponse | null) => void) | null = null;
  private searchStatusCallback: ((status: string) => void) | null = null;
  private matchErrorCallback: ((message: string) => void) | null = null;
  private matchPollingIntervalId: number | null = null;

  readonly GRID_ROWS = 3;
  readonly GRID_COLS = 7;
  readonly TOTAL_SLOTS = this.GRID_ROWS * this.GRID_COLS;

  characterGrid: (Character | null)[][] = Array(this.GRID_ROWS)
    .fill(null)
    .map(() => Array(this.GRID_COLS).fill(null));

  constructor(
    private renderer: Renderer2,
    private profileService: ProfileService,
    private characterService: CharacterSelectionService,
    private authService: AuthService,
    private playSoundService: PlaySoundService,
    private webSocketService: WebsocketService,
    private router: Router,
    private soundService: SoundService,
    private classesMapper: ClassesMapper,
    public costService: CostService
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
            classes: this.classesMapper.mapToClasses(ability),
          })),
        }));

        this.populateGrid(this.characters);
      },
      error: (err) => console.error('Failed to fetch characters', err),
    });

    this.wsSubscription = this.webSocketService.connectionStatus$.subscribe((connected) => {
      if (connected && this.viewMode === ViewMode.SEARCHING && this.selectedMode !== null) {
        console.log('WebSocket connected while searching, sending search request...');
        const characterIds = this.buildCharacterIds();
        if (characterIds) {
          this.webSocketService.searchForMatch(characterIds, this.selectedMode);
          this.startMatchPolling();
        }
      }

      if (!connected && this.viewMode === ViewMode.SEARCHING) {
        this.searchStatusMessage = 'Reconnecting to match server...';
      }
    });

    this.matchCallback = (matchDetails: MatchResponse | null) => {
      this.handleMatchFound(matchDetails);
    };

    this.searchStatusCallback = (status: string) => {
      this.searchStatusMessage = status;
    };

    this.matchErrorCallback = (message: string) => {
      this.matchErrorMessage = message;
      if (this.viewMode === ViewMode.SEARCHING && message.toLowerCase().includes('already in a match')) {
        this.webSocketService.getMatchDetails();
      }
    };

    this.webSocketService.onMatch(this.matchCallback);
    this.webSocketService.onSearchStatus(this.searchStatusCallback);
    this.webSocketService.onMatchError(this.matchErrorCallback);
  }

  ngOnDestroy(): void {
    this.stopMatchPolling();

    if (this.viewMode === ViewMode.SEARCHING) {
      this.webSocketService.cancelSearch();
      this.webSocketService.disconnect();
    }

    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }

    if (this.matchCallback) {
      this.webSocketService.removeMatchCallback(this.matchCallback);
    }

    if (this.searchStatusCallback) {
      this.webSocketService.removeSearchStatusCallback(this.searchStatusCallback);
    }

    if (this.matchErrorCallback) {
      this.webSocketService.removeMatchErrorCallback(this.matchErrorCallback);
    }
  }

  private populateGrid(characters: Character[]): void {
    this.characterGrid = Array(this.GRID_ROWS)
      .fill(null)
      .map(() => Array(this.GRID_COLS).fill(null));

    characters.forEach((character, index) => {
      if (index < this.TOTAL_SLOTS) {
        const row = Math.floor(index / this.GRID_COLS);
        const col = index % this.GRID_COLS;
        this.characterGrid[row][col] = character;
      }
    });
  }

  private buildCharacterIds(): number[] | null {
    const characterIds = this.currentTeam
      .map((slot) => slot.character?.id)
      .filter((id): id is number => typeof id === 'number');

    if (characterIds.length !== this.currentTeam.length) {
      return null;
    }

    return characterIds;
  }

  startSearching(selectedMode: BattleQueueType): void {
    if (!this.authService.hasToken()) {
      this.authService.logout();
      return;
    }

    const characterIds = this.buildCharacterIds();
    if (!characterIds) {
      console.error('Team is not complete!');
      return;
    }

    localStorage.setItem('team', JSON.stringify(this.currentTeam));

    this.playSoundService.playLoopSound(this.soundService.searchingSoundPath);
    this.selectedMode = selectedMode;
    this.selectedCharacter = null;
    this.viewMode = ViewMode.SEARCHING;
    this.searchStatusMessage = 'Connecting to match server...';
    this.matchErrorMessage = '';

    if (!this.webSocketService.isConnected()) {
      this.webSocketService.connect();
      return;
    }

    this.webSocketService.searchForMatch(characterIds, selectedMode);
    this.startMatchPolling();
  }

  stopSearching(): void {
    this.stopMatchPolling();
    this.playSoundService.playSound(this.soundService.stopSearchSoundPath);
    this.webSocketService.cancelSearch();
    this.selectedMode = null;
    this.viewMode = ViewMode.CHARACTER;
    this.webSocketService.disconnect();
    this.searchStatusMessage = 'Search cancelled.';
    this.matchErrorMessage = '';
  }

  matchFound(): void {
    this.stopMatchPolling();
    this.playSoundService.playSound(this.soundService.matchFoundSoundPath);
    this.selectedMode = null;
    this.viewMode = ViewMode.MATCH_FOUND;
    setTimeout(() => {
      this.router.navigate(['/battle']);
    }, 2500);
  }

  handleMatchFound(matchDetails: MatchResponse | null): void {
    if (!matchDetails || !matchDetails.match) {
      return;
    }

    this.matchFound();
  }

  private startMatchPolling(): void {
    if (this.matchPollingIntervalId !== null || this.viewMode !== ViewMode.SEARCHING) {
      return;
    }

    this.matchPollingIntervalId = window.setInterval(() => {
      if (this.viewMode !== ViewMode.SEARCHING) {
        this.stopMatchPolling();
        return;
      }

      if (this.webSocketService.isConnected()) {
        this.webSocketService.getMatchDetails();
      }
    }, 1500);
  }

  private stopMatchPolling(): void {
    if (this.matchPollingIntervalId === null) {
      return;
    }

    window.clearInterval(this.matchPollingIntervalId);
    this.matchPollingIntervalId = null;
  }

  onDragStarted(event: any, character: Character) {
    const element = event.source.element.nativeElement;
    this.renderer.addClass(element, 'dragging');
    this.renderer.setStyle(element, 'position', 'initial');

    const slotIndex = this.currentTeam.findIndex((slot) => slot.character === character);
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
      this.currentTeam[dropResult.slotIndex].character = character;
    }

    event.source._dragRef.reset();
    this.renderer.removeStyle(element, 'position');
    this.renderer.removeStyle(element, 'left');
    this.renderer.removeStyle(element, 'top');
    this.renderer.removeStyle(element, 'margin');
    this.renderer.removeStyle(element, 'transform');
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
        bottom: dropRect.bottom + rangeBuffer,
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

  get visibleCharacters(): Character[] {
    const flatGrid = this.characterGrid.flat().filter((char) => char !== null) as Character[];
    const startIndex = this.currentPage * this.charactersPerPage;
    const endIndex = startIndex + this.charactersPerPage;
    return flatGrid.slice(startIndex, endIndex);
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
      this.currentPage = totalPages - 1;
    }
  }

  selectCharacter(character: Character) {
    this.animateSkillContainer = false;
    this.playSoundService.playSound(this.soundService.openContainerSoundPath);
    this.selectedCharacter = character;
    this.selectedAbility = null;
    this.viewMode = ViewMode.CHARACTER;
    this.animateSkillContainer = true;
  }

  showAbilityDetails(ability: Ability) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedAbility = ability;
    this.viewMode = ViewMode.ABILITY;
  }

  backToCharacterDetails() {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedAbility = null;
    this.viewMode = ViewMode.CHARACTER;
  }

  closeContainer() {
    this.playSoundService.playSound(this.soundService.closeContainerSoundPath);
    this.selectedCharacter = null;
  }

  onLogout() {
    this.authService.logout();
  }

  startQuickGame() {
    window.location.href = '/battle';
  }

  isCharacterInTeamSlot(character: Character): boolean {
    return this.currentTeam.some((slot) => slot.character?.id === character.id);
  }

  isCharacterBeingDragged(character: Character): boolean {
    return character === this.selectedCharacter && this.draggedCharacterIndex !== null;
  }

  addToFirstAvailableSlot(character: Character): void {
    const existingSlotIndex = this.currentTeam.findIndex((slot) => slot.character?.id === character.id);

    if (existingSlotIndex !== -1) {
      this.currentTeam[existingSlotIndex].character = null;
      return;
    }

    const firstAvailableSlot = this.currentTeam.findIndex((slot) => !slot.character);

    if (firstAvailableSlot !== -1) {
      this.currentTeam[firstAvailableSlot].character = character;
      this.selectedCharacter = character;
    }
  }
}
