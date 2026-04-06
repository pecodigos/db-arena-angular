import { Ability } from './../interfaces/ability.interface';
import { ProfileService } from './../../profile/profile.service';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PreventDragDirective } from '../../prevent-drag/prevent-drag.directive';
import { WebsocketService } from '../../websocket/websocket.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatchEndResponse, MatchResponse, MatchSnapshot } from '../interfaces/match-response.interface';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { Fighter } from '../interfaces/fighter.model';
import { SoundService } from '../sounds/sound.service';
import { PlaySoundService } from '../../sounds/play-sound.service';
import { ViewMode } from '../enums/view-mode.enum';
import { CostService } from '../cost/cost.service';
import { Character } from '../interfaces/character.interface';
import { ClassesMapper } from '../mapper/classes-mapper.service';
import { EnergyPool } from '../interfaces/energy-pool.type';
import { Skill } from '../interfaces/skill.interface';
import { Player } from '../interfaces/player.interface';
import { PublicProfile } from '../interfaces/public-profile.interface';
import { EnergyType } from '../interfaces/energy-type.type';

type TeamSide = 'ALLY' | 'ENEMY';

interface QueuedTurnAction {
  characterIndex: number;
  skillIndex: number;
  targetIndexes: number[];
  ability: Ability;
  anyEnergyChoices?: { [key: string]: number };
}

interface PendingSkillSelection {
  characterIndex: number;
  skillIndex: number;
  ability: Ability;
  isHarmful: boolean;
  targetSide: TeamSide;
  allowedTargetIndexes: number[];
}

interface FighterStatusBadge {
  label: string;
  tone: 'BUFF' | 'DEBUFF';
}

type HpTone = 'hp-green' | 'hp-yellow' | 'hp-red';

interface ActiveEffectIndicator {
  name: string;
  imagePath: string | null;
  remainingTurns: number;
  harmful: boolean;
  description: string;
}

type AbilityWithMappedClasses = Ability & { classes: string[] };

@Component({
  selector: 'app-battle',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    PreventDragDirective,
    MatProgressBarModule,
    CommonModule,
  ],
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.scss'
})
export class BattleComponent implements OnInit, OnDestroy {
  private static readonly MAX_HP = 100;

  profile: PublicProfile | null = null;
  opponent: PublicProfile | null = null;
  progressValue = 100;
  match: MatchSnapshot | null = null;
  myPlayer: Player | null = null;
  enemyPlayer: Player | null = null;

  selectedProfile: PublicProfile | null = null;
  selectedCharacter: Character | null = null;
  selectedAbility: AbilityWithMappedClasses | null = null;

  viewMode: ViewMode | null = null;
  isMyTurn = false;
  exchangeEnergy = false;
  isSubmittingTurn = false;
  turnErrorMessage: string | null = null;
  pendingSelection: PendingSkillSelection | null = null;
  queuedActionsByCharacter: (QueuedTurnAction | null)[] = Array.from({ length: 3 }, () => null);
  queuedActions: QueuedTurnAction[] = [];

  // --- Any Energy Modal State ---
  showAnyEnergyModal = false;
  pendingAnyEnergyAction: QueuedTurnAction | null = null;
  anyEnergyRequiredTotal = 0;
  anyEnergySelectedTotal = 0;
  availableEnergiesForAny: { type: EnergyType; available: number; selected: number; imagePath: string; class: string }[] = [];

  // --- Match-end state ---
  matchResult: 'WIN' | 'LOSS' | null = null;
  matchEndData: MatchEndResponse | null = null;
  showSurrenderConfirmModal = false;
  isSurrenderPending = false;

  // --- Turn transition banner ---
  turnBannerText: string | null = null;
  turnBannerTone: 'YOUR_TURN' | 'ENEMY_TURN' = 'ENEMY_TURN';
  private turnBannerTimer: ReturnType<typeof setTimeout> | null = null;

  // --- HP delta tracking (floating damage/heal numbers) ---
  allyHpDeltas: number[] = [0, 0, 0];
  enemyHpDeltas: number[] = [0, 0, 0];
  allyDeltaVisible: boolean[] = [false, false, false];
  enemyDeltaVisible: boolean[] = [false, false, false];
  private previousAllyHp: number[] = [100, 100, 100];
  private previousEnemyHp: number[] = [100, 100, 100];
  private deltaTimers: ReturnType<typeof setTimeout>[] = [];

  team: (Fighter | null)[] = Array.from({ length: 3 }, () => null);
  opponentTeam: (Fighter | null)[] = Array.from({ length: 3 }, () => null );
  readonly spendableEnergyTypes: EnergyType[] = ['COMBAT', 'BLOODLINE', 'KI', 'TECHNIQUE'];

  private timerSubscription: Subscription | null = null;
  private wsSubscription: Subscription | null = null;
  private matchCallback: ((message: MatchResponse | null) => void) | null = null;
  private matchErrorCallback: ((message: string) => void) | null = null;
  private matchEndCallback: ((payload: MatchEndResponse) => void) | null = null;

  constructor(
    private profileService: ProfileService,
    private webSocketService: WebsocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private soundService: SoundService,
    private playSoundService: PlaySoundService,
    private classesMapper: ClassesMapper,
    private router: Router,
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

    this.setupWebSocketConnection();
    this.setupMatchErrorSubscription();
    this.setupMatchEndSubscription();
    this.startTimer();
  }

  private setupWebSocketConnection(): void {
    this.wsSubscription = this.webSocketService.connectionStatus$.subscribe((connected) => {
      if (connected) {
        this.setupMatchSubscription();

        this.webSocketService.getMatchDetails();
      }
    });

    if (!this.webSocketService.isConnected()) {
      this.webSocketService.connect();
    } else {
      this.setupMatchSubscription();
      this.webSocketService.getMatchDetails();
    }
  }

  private setupMatchSubscription(): void {
    this.matchCallback = (response: MatchResponse | null) => {
      if (!response?.match) {
        this.clearLiveMatchState();
        return;
      }

      const previousTurnState = this.isMyTurn;
      this.match = response.match;

      const currentUsername = localStorage.getItem('username');
      const playerOne = this.match.playerOne;
      const playerTwo = this.match.playerTwo;

      if (!playerOne?.userProfile?.username || !playerTwo?.userProfile?.username || !currentUsername) {
        return;
      }

      const isPlayerOne = playerOne.userProfile.username === currentUsername;

      this.myPlayer = isPlayerOne ? playerOne : playerTwo;
      this.enemyPlayer = isPlayerOne ? playerTwo : playerOne;
      this.opponent = this.enemyPlayer.userProfile;

      this.isMyTurn = this.match.currentPlayer?.userProfile?.username === currentUsername;

      // --- Compute HP deltas before updating team arrays ---
      this.computeHpDeltas(this.myPlayer.team, this.previousAllyHp, this.allyHpDeltas, this.allyDeltaVisible, 'ally');
      this.computeHpDeltas(this.enemyPlayer.team, this.previousEnemyHp, this.enemyHpDeltas, this.enemyDeltaVisible, 'enemy');

      this.team = [...this.myPlayer.team];
      this.opponentTeam = [...this.enemyPlayer.team];

      this.ensureQueuedActionCapacity();

      if (previousTurnState !== this.isMyTurn) {
        this.progressValue = 100;
        this.resetTurnPlanningState();
        this.showTurnBanner(this.isMyTurn);
      }

      if (!this.isMyTurn) {
        this.isSubmittingTurn = false;
      }

      this.cdr.detectChanges();
    };
    this.webSocketService.onMatch(this.matchCallback);
  }

  private setupMatchErrorSubscription(): void {
    this.matchErrorCallback = (message: string) => {
      this.turnErrorMessage = message || 'Invalid queued actions. Review your turn queue and try again.';
      this.exchangeEnergy = true;
    this.recalculateAnyEnergy();
      this.isSubmittingTurn = false;
      this.cdr.detectChanges();
    };

    this.webSocketService.onMatchError(this.matchErrorCallback);
  }

  startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.progressValue > 0) {
        this.progressValue = Math.max(0, this.progressValue - 2);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }

    if (this.matchCallback) {
      this.webSocketService.removeMatchCallback(this.matchCallback);
    }

    if (this.matchErrorCallback) {
      this.webSocketService.removeMatchErrorCallback(this.matchErrorCallback);
    }

    if (this.matchEndCallback) {
      this.webSocketService.removeMatchEndCallback(this.matchEndCallback);
    }

    if (this.turnBannerTimer) {
      clearTimeout(this.turnBannerTimer);
    }

    for (const timer of this.deltaTimers) {
      clearTimeout(timer);
    }
  }

  selectCharacter(character: Character) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedCharacter = character;
    this.selectedAbility = null;
    this.selectedProfile = null;
    this.viewMode = ViewMode.CHARACTER;
  }

  public selectCharacterFromFighter(fighter: Fighter | null): void {
    const character = fighter?.character;
    if (!character) {
      return;
    }

    this.selectCharacter(character);
  }

  showAbilityDetails(ability: Ability) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedAbility = {
      ...ability,
      classes: this.classesMapper.mapToClasses(ability),
    };
    this.viewMode = ViewMode.ABILITY;
    this.selectedCharacter = null;
    this.selectedProfile = null;
  }

  public getAbilityTargetLabel(ability: Ability | null | undefined): 'ENEMY' | 'ALLY' {
    if (!ability) {
      return 'ALLY';
    }

    return this.isAbilityHarmful(ability) ? 'ENEMY' : 'ALLY';
  }

  backToCharacterDetails() {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedAbility = null;
    this.viewMode = ViewMode.CHARACTER;
  }

  selectProfile(profile: PublicProfile) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedProfile = profile;
    this.selectedCharacter = null;
    this.selectedAbility = null;
    this.viewMode = ViewMode.PROFILE;
  }

  selectOpponentProfile(opponent: PublicProfile) {
    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.selectedProfile = opponent;
    this.selectedCharacter = null;
    this.selectedAbility = null;
    this.viewMode = ViewMode.PROFILE;
  }

  openExchangeEnergy(): void {
    if (!this.isMyTurn) {
      return;
    }

    if (this.pendingSelection) {
      this.turnErrorMessage = `Select ${this.pendingSelection.isHarmful ? 'an enemy' : 'an ally'} target before ending your turn.`;
    }

    this.exchangeEnergy = true;
    this.recalculateAnyEnergy();
  }

  closeExchangeEnergy(): void {
    this.exchangeEnergy = false;
  }

  public recalculateAnyEnergy(): void {
    this.anyEnergySelectedTotal = 0;
    this.anyEnergyRequiredTotal = 0;
    const pool = { ...(this.myPlayer?.energyPool || {}) };

    for (const action of this.queuedActions) {
      for (const cost of action.ability.cost || []) {
        const amount = this.toPositiveEnergyAmount(cost?.amount);
        if (!amount || cost.energyType === 'ANY' || cost.energyType === 'NONE') continue;
        const mappedType = this.asSpendableEnergyType(cost.energyType);
        if (mappedType && pool[mappedType]) {
          pool[mappedType] = Math.max(0, (pool[mappedType] || 0) - amount);
        }
      }
      
      const anyCost = (action.ability.cost || []).find(c => c.energyType === 'ANY');
      if (anyCost) {
        this.anyEnergyRequiredTotal += this.toPositiveEnergyAmount(anyCost.amount) || 0;
      }
    }

    this.availableEnergiesForAny = this.spendableEnergyTypes.map(type => {
      return {
        type,
        available: pool[type] || 0,
        selected: 0,
        imagePath: this.costService.getEnergyImage(type),
        class: this.getEnergyTypeClass(type)
      };
    });
  }


  public surrenderMatch(): void {
    if (this.matchResult || this.isSurrenderPending) {
      return;
    }

    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.showSurrenderConfirmModal = true;
  }

  public closeSurrenderConfirmation(): void {
    this.showSurrenderConfirmModal = false;
  }

  public confirmSurrenderMatch(): void {
    if (this.isSurrenderPending) {
      return;
    }

    this.playSoundService.playSound(this.soundService.clickSoundPath);
    this.showSurrenderConfirmModal = false;

    if (!this.webSocketService.isConnected()) {
      return;
    }

    this.isSurrenderPending = true;
    this.webSocketService.forfeitMatch();
  }

  public returnToSelection(): void {
    this.router.navigate(['/character-selection']);
  }

  public onSkillClick(fighterIndex: number, skillIndex: number): void {
    const skill = this.getSkill(fighterIndex, skillIndex);
    if (!skill?.ability) {
      return;
    }

    this.showAbilityDetails(skill.ability);

    if (!this.isMyTurn || !this.canUseSkill(fighterIndex, skillIndex)) {
      return;
    }

    const isHarmful = this.isAbilityHarmful(skill.ability);
    const targetSide: TeamSide = isHarmful ? 'ENEMY' : 'ALLY';
    const allowedTargetIndexes = this.getValidTargetIndexes(targetSide, fighterIndex, skill.ability, isHarmful);

    if (allowedTargetIndexes.length === 0) {
      this.turnErrorMessage = `No valid ${isHarmful ? 'enemy' : 'ally'} target is available for ${skill.ability.name}.`;
      return;
    }

    this.pendingSelection = {
      characterIndex: fighterIndex,
      skillIndex,
      ability: skill.ability,
      isHarmful,
      targetSide,
      allowedTargetIndexes,
    };

    this.turnErrorMessage = `Select ${this.pendingSelection.isHarmful ? 'an enemy' : 'an ally'} target for ${skill.ability.name}.`;
    this.exchangeEnergy = false;
  }

  public onFighterClick(side: TeamSide, fighterIndex: number): void {
    if (this.pendingSelection && this.isTargetSelectable(side, fighterIndex)) {
      this.queuePendingSkillTarget(side, fighterIndex);
      return;
    }

    const fighter = this.getFighterBySide(side, fighterIndex);
    if (fighter?.character) {
      this.selectCharacter(fighter.character);
    }
  }

  public canUseSkill(fighterIndex: number, skillIndex: number): boolean {
    if (!this.isMyTurn) {
      return false;
    }

    const fighter = this.team[fighterIndex];
    const skill = this.getSkill(fighterIndex, skillIndex);

    if (!fighter || !skill?.ability) {
      return false;
    }

    if (this.hasQueuedAction(fighterIndex)) {
      return false;
    }

    if (!this.isFighterAlive(fighter) || this.isFighterStunned(fighter) || skill.currentCooldown > 0) {
      return false;
    }

    if (skill.ability.effectType === 'INVULNERABLE' && this.isFighterUnableToBecomeInvulnerable(fighter)) {
      return false;
    }

    return this.hasEnoughEnergyForAbility(skill.ability, fighterIndex);
  }

  public isSkillQueued(fighterIndex: number, skillIndex: number): boolean {
    const queuedAction = this.queuedActionsByCharacter[fighterIndex];
    return !!queuedAction && queuedAction.skillIndex === skillIndex;
  }

  public isPendingSelection(fighterIndex: number, skillIndex: number): boolean {
    return !!this.pendingSelection
      && this.pendingSelection.characterIndex === fighterIndex
      && this.pendingSelection.skillIndex === skillIndex;
  }

  public hasQueuedAction(fighterIndex: number): boolean {
    return !!this.queuedActionsByCharacter[fighterIndex];
  }

  public getQueuedAbilityImage(fighterIndex: number): string | null {
    return this.queuedActionsByCharacter[fighterIndex]?.ability.imagePath || null;
  }

  public moveActionUp(index: number): void {
    if (index > 0 && index < this.queuedActions.length) {
      const temp = this.queuedActions[index];
      this.queuedActions[index] = this.queuedActions[index - 1];
      this.queuedActions[index - 1] = temp;
    }
  }

  public moveActionDown(index: number): void {
    if (index >= 0 && index < this.queuedActions.length - 1) {
      const temp = this.queuedActions[index];
      this.queuedActions[index] = this.queuedActions[index + 1];
      this.queuedActions[index + 1] = temp;
    }
  }

  public removeQueuedAction(fighterIndex: number): void {
    if (!this.isMyTurn || !this.queuedActionsByCharacter[fighterIndex]) {
      return;
    }

    this.queuedActionsByCharacter[fighterIndex] = null;
    if (this.pendingSelection?.characterIndex === fighterIndex) {
      this.pendingSelection = null;
    }
    this.syncQueuedActions();
    this.turnErrorMessage = null;
  }

  public clearQueuedActions(): void {
    this.queuedActionsByCharacter = Array.from({ length: this.queuedActionsByCharacter.length || 3 }, () => null);
    this.pendingSelection = null;
    this.turnErrorMessage = null;
    this.syncQueuedActions();
  }

  public submitTurnActions(): void {
    if (!this.isMyTurn || this.isSubmittingTurn) {
      return;
    }

    if (this.pendingSelection) {
      this.turnErrorMessage = `Select ${this.pendingSelection.isHarmful ? 'an enemy' : 'an ally'} target before ending your turn.`;
      return;
    }

        if (this.anyEnergyRequiredTotal > 0 && this.anyEnergySelectedTotal < this.anyEnergyRequiredTotal) {
      this.turnErrorMessage = `Please complete your RANDOM energy selection.`;
      return;
    }

    const leftoverChoices: { [key: string]: number } = {};
    for (const en of this.availableEnergiesForAny) {
      if (en.selected > 0) {
        leftoverChoices[en.type] = en.selected;
      }
    }

    const actions = this.queuedActions.map((queuedAction) => {
      const anyCost = (queuedAction.ability.cost || []).find(c => c.energyType === 'ANY');
      const actionAnyRequired = anyCost ? this.toPositiveEnergyAmount(anyCost.amount) || 0 : 0;
      
      const anyEnergyChoices: { [key: string]: number } = {};
      if (actionAnyRequired > 0) {
          let needed = actionAnyRequired;
          for (const [type, amount] of Object.entries(leftoverChoices)) {
              if (amount > 0 && needed > 0) {
                  const used = Math.min(amount, needed);
                  anyEnergyChoices[type] = used;
                  leftoverChoices[type] -= used;
                  needed -= used;
              }
          }
      }

      return {
        characterIndex: queuedAction.characterIndex,
        skillIndex: queuedAction.skillIndex,
        targetIndexes: queuedAction.targetIndexes,
        anyEnergyChoices: actionAnyRequired > 0 ? anyEnergyChoices : undefined,
      };
    });

    this.turnErrorMessage = null;
    this.isSubmittingTurn = true;
    this.exchangeEnergy = false;

    this.webSocketService.endTurn({ actions });
  }

  public isTargetSelectable(side: TeamSide, fighterIndex: number): boolean {
    if (!this.pendingSelection) {
      return false;
    }

    if (side !== this.pendingSelection.targetSide) {
      return false;
    }

    return this.pendingSelection.allowedTargetIndexes.includes(fighterIndex);
  }

  public isQueuedTarget(side: TeamSide, fighterIndex: number): boolean {
    return this.queuedActions.some((queuedAction) => {
      const queuedTargetSide: TeamSide = this.isAbilityHarmful(queuedAction.ability) ? 'ENEMY' : 'ALLY';
      return queuedTargetSide === side && queuedAction.targetIndexes.includes(fighterIndex);
    });
  }

  public getFighterHpPercent(fighter: Fighter | null): number {
    const currentHp = this.getFighterCurrentHp(fighter);
    const percent = (currentHp / BattleComponent.MAX_HP) * 100;
    return Math.min(100, Math.max(0, percent));
  }

  public getFighterHpTone(fighter: Fighter | null): HpTone {
    const hpPercent = this.getFighterHpPercent(fighter);

    if (hpPercent <= 30) {
      return 'hp-red';
    }

    if (hpPercent <= 60) {
      return 'hp-yellow';
    }

    return 'hp-green';
  }

  public getFighterHpLabel(fighter: Fighter | null): string {
    return `${this.getFighterCurrentHp(fighter)}/${BattleComponent.MAX_HP}`;
  }

  public getEffectTooltip(effect: ActiveEffectIndicator): string {
    const turnsText = effect.remainingTurns > 0 ? `\nContinues for ${effect.remainingTurns} turns` : '';
    const descText = effect.description ? `\n${effect.description}` : '';
    return `${effect.name}${descText}${turnsText}`;
  }

  public getActiveEffectIndicators(fighter: Fighter | null, perspective: TeamSide = 'ALLY'): ActiveEffectIndicator[] {
    if (!fighter) {
      return [];
    }

    const rawFighter = fighter as unknown as Record<string, unknown>;
    const rawEffects = rawFighter['activeEffects'];

    if (!Array.isArray(rawEffects)) {
      return [];
    }

    const indicators: ActiveEffectIndicator[] = [];

    for (const rawEffect of rawEffects) {
      if (!rawEffect || typeof rawEffect !== 'object') {
        continue;
      }

      const effect = rawEffect as Record<string, unknown>;
      const nameValue = effect['name'];
      if (typeof nameValue !== 'string' || !nameValue.trim()) {
        continue;
      }

      const imagePathValue = effect['imagePath'];
      const imagePath = typeof imagePathValue === 'string' && imagePathValue.length > 0
        ? imagePathValue
        : null;

      const remainingTurnsValue = effect['remainingTurns'];
      const remainingTurns = typeof remainingTurnsValue === 'number' ? Math.max(0, remainingTurnsValue) : 0;

      const harmfulValue = effect['isHarmful'] ?? effect['harmful'];
      const harmful = typeof harmfulValue === 'boolean' ? harmfulValue : false;

      const invisibleValue = effect['isInvisible'] ?? effect['invisible'];
      const invisible = typeof invisibleValue === 'boolean' ? invisibleValue : false;
      if (perspective === 'ENEMY' && invisible) {
        continue;
      }

      const descriptionValue = effect['description'];
      const description = typeof descriptionValue === 'string' ? descriptionValue : '';

      indicators.push({
        name: nameValue,
        imagePath,
        remainingTurns,
        harmful,
        description,
      });
    }

    const unableToBecomeInvulnerable = this.getFighterBooleanState(
      fighter,
      'isUnableToBecomeInvulnerable',
      'unableToBecomeInvulnerable'
    );
    if (unableToBecomeInvulnerable) {
      if (!indicators.some(i => i.name === 'Exposed')) {
        indicators.push({
          name: 'Exposed',
          imagePath: null,
          remainingTurns: 0,
          harmful: true,
          description: 'This character cannot become invulnerable.'
        });
      }
    }

    return indicators;
  }

  public getCharacterName(characterIndex: number): string {
    return this.team[characterIndex]?.character?.name || `Fighter ${characterIndex + 1}`;
  }

  private processQueueAction(action: QueuedTurnAction): void {
    this.finalizeQueueAction(action);
  }

  private finalizeQueueAction(action: QueuedTurnAction): void {
    this.queuedActionsByCharacter[action.characterIndex] = action;
    this.pendingSelection = null;
    this.turnErrorMessage = null;
    this.syncQueuedActions();
  }

    private getEnergyTypeClass(type: EnergyType): string {
    switch (type) {
      case 'COMBAT': return 'bg-green';
      case 'KI': return 'bg-blue';
      case 'BLOODLINE': return 'bg-red';
      case 'TECHNIQUE': return 'bg-white';
      default: return '';
    }
  }

  public incrementAnyEnergy(energy: { type: EnergyType; available: number; selected: number }): void {
    if (this.anyEnergySelectedTotal < this.anyEnergyRequiredTotal && energy.selected < energy.available) {
      energy.selected++;
      this.anyEnergySelectedTotal++;
    }
  }

  public decrementAnyEnergy(energy: { type: EnergyType; available: number; selected: number }): void {
    if (energy.selected > 0) {
      energy.selected--;
      this.anyEnergySelectedTotal--;
    }
  }

  public getTargetName(action: QueuedTurnAction): string {
    if (action.ability.effectType === 'AOE') {
      const targetPool = this.isAbilityHarmful(action.ability) ? this.opponentTeam : this.team;
      const primaryTargetIndex = action.targetIndexes[0];
      const primaryTargetName = targetPool[primaryTargetIndex]?.character?.name;
      const groupLabel = this.isAbilityHarmful(action.ability) ? 'All Enemies' : 'All Allies';

      return primaryTargetName ? `${groupLabel} (${primaryTargetName})` : groupLabel;
    }

    const targets = this.isAbilityHarmful(action.ability) ? this.opponentTeam : this.team;
    const targetIndex = action.targetIndexes[0];
    return targets[targetIndex]?.character?.name || `Target ${targetIndex + 1}`;
  }

  public getProjectedEnergyAmount(energyType: string): number {
    const mappedType = this.asSpendableEnergyType(energyType);
    if (!mappedType) {
      return 0;
    }

    const projectedPool = this.getProjectedEnergyPool();
    return projectedPool[mappedType] || 0;
  }

  public getProjectedTotalEnergy(): number {
    const projectedPool = this.getProjectedEnergyPool();
    return this.spendableEnergyTypes.reduce((total, type) => total + (projectedPool[type] || 0), 0);
  }

  private queuePendingSkillTarget(side: TeamSide, fighterIndex: number): void {
    if (!this.pendingSelection || !this.isTargetSelectable(side, fighterIndex)) {
      return;
    }

    this.processQueueAction({
      characterIndex: this.pendingSelection.characterIndex,
      skillIndex: this.pendingSelection.skillIndex,
      targetIndexes: [fighterIndex],
      ability: this.pendingSelection.ability,
    });
  }

  private getValidTargetIndexes(
    side: TeamSide,
    actingFighterIndex: number,
    ability: Ability,
    isHarmful: boolean
  ): number[] {
    const targetPool = side === 'ALLY' ? this.team : this.opponentTeam;
    const validTargetIndexes = targetPool
      .map((fighter, index) => {
        if (!fighter || !this.isFighterAlive(fighter)) {
          return -1;
        }

        if (isHarmful && this.isFighterInvulnerable(fighter)) {
          return -1;
        }

        return index;
      })
      .filter((index) => index !== -1);

    if (ability.distance === 'NONE') {
      return side === 'ALLY' && validTargetIndexes.includes(actingFighterIndex)
        ? [actingFighterIndex]
        : [];
    }

    return validTargetIndexes;
  }

  private getSkill(fighterIndex: number, skillIndex: number): Skill | null {
    const fighter = this.team[fighterIndex];
    if (!fighter?.skills || skillIndex < 0 || skillIndex >= fighter.skills.length) {
      return null;
    }

    return fighter.skills[skillIndex] || null;
  }

  private hasEnoughEnergyForAbility(ability: Ability, characterIndexToReplace: number): boolean {
    if (!ability?.cost?.length) {
      return true;
    }

    const projectedPool = this.getProjectedEnergyPool(characterIndexToReplace);
    return this.hasEnoughEnergyInPool(projectedPool, ability);
  }

  private hasEnoughEnergyInPool(energyPool: EnergyPool, ability: Ability): boolean {
    const specificCosts: Partial<Record<EnergyType, number>> = {};
    let anyRequired = 0;

    for (const cost of ability.cost || []) {
      const amount = this.toPositiveEnergyAmount(cost?.amount);
      const energyType = cost?.energyType;

      if (!amount || !energyType || energyType === 'NONE') {
        continue;
      }

      if (energyType === 'ANY') {
        anyRequired += amount;
        continue;
      }

      const mappedType = this.asSpendableEnergyType(energyType);
      if (!mappedType) {
        return false;
      }

      const available = energyPool[mappedType] || 0;
      if (available < amount) {
        return false;
      }

      specificCosts[mappedType] = (specificCosts[mappedType] || 0) + amount;
    }

    let totalLeftover = 0;
    for (const energyType of this.spendableEnergyTypes) {
      const available = energyPool[energyType] || 0;
      const reserved = specificCosts[energyType] || 0;
      totalLeftover += Math.max(0, available - reserved);
    }

    return totalLeftover >= anyRequired;
  }

  private getProjectedEnergyPool(excludeCharacterIndex?: number): EnergyPool {
    const projectedPool: EnergyPool = {
      ...(this.myPlayer?.energyPool || {}),
    };

    for (const queuedAction of this.queuedActions) {
      if (excludeCharacterIndex !== undefined && queuedAction.characterIndex === excludeCharacterIndex) {
        continue;
      }

      this.consumeEnergy(projectedPool, queuedAction.ability, queuedAction.anyEnergyChoices);
    }

    return projectedPool;
  }

  private consumeEnergy(energyPool: EnergyPool, ability: Ability, anyEnergyChoices?: { [key: string]: number }): void {
    let anyRequired = 0;
    
    for (const cost of ability.cost || []) {
      const amount = this.toPositiveEnergyAmount(cost?.amount);
      const energyType = cost?.energyType;

      if (!amount || !energyType || energyType === 'NONE') {
        continue;
      }

      if (energyType === 'ANY') {
        anyRequired += amount;
        continue;
      }

      const mappedType = this.asSpendableEnergyType(energyType);
      if (!mappedType) {
        continue;
      }

      const remaining = Math.max(0, (energyPool[mappedType] || 0) - amount);
      if (remaining === 0) {
        delete energyPool[mappedType];
      } else {
        energyPool[mappedType] = remaining;
      }
    }
    
    if (anyEnergyChoices && Object.keys(anyEnergyChoices).length > 0) {
      for (const [energyType, amount] of Object.entries(anyEnergyChoices)) {
        if (!amount) continue;
        const mappedType = this.asSpendableEnergyType(energyType);
        if (!mappedType) continue;
        
        const remaining = Math.max(0, (energyPool[mappedType] || 0) - amount);
        if (remaining === 0) delete energyPool[mappedType];
        else energyPool[mappedType] = remaining;
      }
    } else if (anyRequired > 0) {
        this.consumeAnyEnergy(energyPool, anyRequired);
    }
  }

  private consumeAnyEnergy(energyPool: EnergyPool, amount: number): void {
    let remaining = amount;

    for (const energyType of this.spendableEnergyTypes) {
      if (remaining === 0) {
        break;
      }

      const available = energyPool[energyType] || 0;
      if (available <= 0) {
        continue;
      }

      const consumed = Math.min(available, remaining);
      const updatedValue = available - consumed;

      if (updatedValue === 0) {
        delete energyPool[energyType];
      } else {
        energyPool[energyType] = updatedValue;
      }

      remaining -= consumed;
    }
  }

  private toPositiveEnergyAmount(value: number | undefined): number {
    if (!value || value < 0) {
      return 0;
    }

    return value;
  }

  private asSpendableEnergyType(energyType: string): EnergyType | null {
    const spendableTypes: EnergyType[] = ['COMBAT', 'BLOODLINE', 'KI', 'TECHNIQUE'];
    return spendableTypes.includes(energyType as EnergyType) ? (energyType as EnergyType) : null;
  }

  public isFighterAlive(fighter: Fighter): boolean {
    const aliveFlag = this.getFighterBooleanState(fighter, 'isAlive', 'alive');
    return aliveFlag !== false;
  }

  private isFighterStunned(fighter: Fighter): boolean {
    return this.getFighterBooleanState(fighter, 'isStunned', 'stunned');
  }

  public isFighterInvulnerable(fighter: Fighter): boolean {
    return this.getFighterBooleanState(fighter, 'isInvulnerable', 'invulnerable');
  }

  private isFighterUnableToBecomeInvulnerable(fighter: Fighter): boolean {
    return this.getFighterBooleanState(
      fighter,
      'isUnableToBecomeInvulnerable',
      'unableToBecomeInvulnerable'
    );
  }

  private isAbilityHarmful(ability: Ability): boolean {
    const rawAbility = ability as unknown as {
      isHarmful?: boolean;
      harmful?: boolean;
      damage?: number;
      damageType?: string;
      effectType?: string;
    };

    const explicitValue = rawAbility.isHarmful ?? rawAbility.harmful;
    const inferredValue = this.inferHarmfulFromAbilityShape(rawAbility);

    if (typeof explicitValue === 'boolean') {
      if (explicitValue) {
        return true;
      }

      // Defensive fallback for legacy payloads where offensive skills were persisted as non-harmful.
      return inferredValue;
    }

    return inferredValue;
  }

  private inferHarmfulFromAbilityShape(rawAbility: {
    damage?: number;
    damageType?: string;
    effectType?: string;
  }): boolean {
    const damage = typeof rawAbility.damage === 'number' ? rawAbility.damage : 0;
    const damageType = rawAbility.damageType || 'NONE';
    const effectType = rawAbility.effectType || 'NONE';

    if (effectType === 'HEAL' || effectType === 'DESTRUCTABLE_DEFENSE' || effectType === 'DAMAGE_REDUCTION' || effectType === 'INVULNERABLE') {
      return false;
    }

    if (damage > 0) {
      return true;
    }

    if (damageType !== 'NONE') {
      return true;
    }

    return effectType === 'STUN' || effectType === 'AOE' || effectType === 'ENERGY_REMOVAL' || effectType === 'ENERGY_DRAIN' || effectType === 'DOT';
  }

  private getFighterCurrentHp(fighter: Fighter | null): number {
    if (!fighter) {
      return 0;
    }

    const rawFighter = fighter as unknown as Record<string, number | boolean | undefined>;
    const value = rawFighter['currentHp'];
    if (typeof value !== 'number') {
      return 0;
    }

    return Math.max(0, Math.min(BattleComponent.MAX_HP, value));
  }

  private getFighterBooleanState(
    fighter: Fighter,
    canonicalKey: keyof Fighter,
    fallbackKey: string
  ): boolean {
    const rawFighter = fighter as unknown as Record<string, boolean | number | undefined>;
    const canonicalValue = rawFighter[String(canonicalKey)];

    if (typeof canonicalValue === 'boolean') {
      return canonicalValue;
    }

    return !!rawFighter[fallbackKey];
  }

  private getFighterNumberState(fighter: Fighter, key: string): number {
    const rawFighter = fighter as unknown as Record<string, number | boolean | undefined>;
    const value = rawFighter[key];
    return typeof value === 'number' ? value : 0;
  }

  private formatTurns(turns: number): string {
    return turns > 0 ? ` ${turns}T` : '';
  }

  private getFighterBySide(side: TeamSide, fighterIndex: number): Fighter | null {
    return (side === 'ALLY' ? this.team[fighterIndex] : this.opponentTeam[fighterIndex]) || null;
  }

  private ensureQueuedActionCapacity(): void {
    const expectedSlots = this.team.length || 3;
    if (this.queuedActionsByCharacter.length !== expectedSlots) {
      this.queuedActionsByCharacter = Array.from({ length: expectedSlots }, () => null);
      this.syncQueuedActions();
    }
  }

  private syncQueuedActions(): void {
    const existingOrderedActions = [...this.queuedActions];
    const newActions = this.queuedActionsByCharacter.filter((action): action is QueuedTurnAction => !!action);

    const updatedActions = existingOrderedActions.filter(action =>
      newActions.some(newA => newA.characterIndex === action.characterIndex)
    );

    const completelyNewActions = newActions.filter(action =>
      !updatedActions.some(upA => upA.characterIndex === action.characterIndex)
    );

    this.queuedActions = [...updatedActions, ...completelyNewActions];
  }

  private resetTurnPlanningState(): void {
    this.pendingSelection = null;
    this.exchangeEnergy = false;
    this.turnErrorMessage = null;
    this.isSubmittingTurn = false;
    this.clearQueuedActions();
  }

  private clearLiveMatchState(): void {
    this.match = null;
    this.myPlayer = null;
    this.enemyPlayer = null;
    this.opponent = null;
    this.isMyTurn = false;
    this.isSubmittingTurn = false;
    this.pendingSelection = null;
    this.queuedActionsByCharacter = Array.from({ length: 3 }, () => null);
    this.queuedActions = [];
    this.team = Array.from({ length: 3 }, () => null);
    this.opponentTeam = Array.from({ length: 3 }, () => null);
  }

  // ───────────────────────────────────────────
  // Match-end handling
  // ───────────────────────────────────────────

  private setupMatchEndSubscription(): void {
    this.matchEndCallback = (payload: MatchEndResponse) => {
      const currentUsername = localStorage.getItem('username');
      if (!currentUsername) {
        return;
      }

      this.matchEndData = payload;
      this.matchResult = this.usernamesMatch(payload.winner?.username, currentUsername) ? 'WIN' : 'LOSS';
      this.isSurrenderPending = false;
      this.showSurrenderConfirmModal = false;
      this.cdr.detectChanges();
    };

    this.webSocketService.onMatchEnd(this.matchEndCallback);
  }

  private usernamesMatch(left: string | null | undefined, right: string | null | undefined): boolean {
    if (!left || !right) {
      return false;
    }

    return left.trim().toLowerCase() === right.trim().toLowerCase();
  }

  // ───────────────────────────────────────────
  // Turn transition banner
  // ───────────────────────────────────────────

  private showTurnBanner(isMyTurn: boolean): void {
    if (this.turnBannerTimer) {
      clearTimeout(this.turnBannerTimer);
    }

    this.turnBannerText = isMyTurn ? 'YOUR TURN!' : 'ENEMY TURN';
    this.turnBannerTone = isMyTurn ? 'YOUR_TURN' : 'ENEMY_TURN';

    this.turnBannerTimer = setTimeout(() => {
      this.turnBannerText = null;
      this.cdr.detectChanges();
    }, 1800);
  }

  // ───────────────────────────────────────────
  // HP delta tracking (floating damage/heal numbers)
  // ───────────────────────────────────────────

  private computeHpDeltas(
    currentTeam: Fighter[],
    previousHp: number[],
    deltas: number[],
    visible: boolean[],
    side: 'ally' | 'enemy'
  ): void {
    if (!currentTeam || currentTeam.length === 0) {
      return;
    }

    for (let i = 0; i < currentTeam.length && i < 3; i++) {
      const fighter = currentTeam[i];
      const currentHp = this.getFighterCurrentHp(fighter);
      const prevHp = previousHp[i];
      const delta = currentHp - prevHp;

      if (delta !== 0) {
        deltas[i] = delta;
        visible[i] = true;

        const timerIndex = side === 'ally' ? i : i + 3;
        if (this.deltaTimers[timerIndex]) {
          clearTimeout(this.deltaTimers[timerIndex]);
        }

        this.deltaTimers[timerIndex] = setTimeout(() => {
          visible[i] = false;
          this.cdr.detectChanges();
        }, 1200);
      }

      previousHp[i] = currentHp;
    }
  }

  public getHpDeltaLabel(side: 'ally' | 'enemy', index: number): string {
    const deltas = side === 'ally' ? this.allyHpDeltas : this.enemyHpDeltas;
    const delta = deltas[index] || 0;
    if (delta > 0) {
      return `+${delta}`;
    }
    return `${delta}`;
  }

  public isHpDeltaVisible(side: 'ally' | 'enemy', index: number): boolean {
    return (side === 'ally' ? this.allyDeltaVisible : this.enemyDeltaVisible)[index] || false;
  }

  public isHpDeltaPositive(side: 'ally' | 'enemy', index: number): boolean {
    const deltas = side === 'ally' ? this.allyHpDeltas : this.enemyHpDeltas;
    return (deltas[index] || 0) > 0;
  }
}
