import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { BattleComponent } from './battle.component';
import { ProfileService } from '../../profile/profile.service';
import { WebsocketService } from '../../websocket/websocket.service';
import { AuthService } from '../../auth/auth.service';
import { SoundService } from '../sounds/sound.service';
import { PlaySoundService } from '../../sounds/play-sound.service';
import { MatchResponse } from '../interfaces/match-response.interface';

const mockProfile = {
  username: 'test-user',
  ladderRank: 0,
  clan: 'test-clan',
  role: 'USER',
  rank: 'Genin',
  profilePicturePath: 'assets/profile-picture/default.png',
  currentLevel: 1,
  highestLevel: 1,
  currentExp: 0,
  wins: 0,
  loses: 0,
  currentStreak: 0,
  highestStreak: 0,
  createdAt: '2026-01-01',
};

const profileServiceMock = {
  getPublicProfile: jasmine.createSpy('getPublicProfile').and.returnValue(of(mockProfile)),
};

const websocketServiceMock = {
  connectionStatus$: of(false),
  onMatch: jasmine.createSpy('onMatch'),
  onMatchError: jasmine.createSpy('onMatchError'),
  onMatchEnd: jasmine.createSpy('onMatchEnd'),
  removeMatchCallback: jasmine.createSpy('removeMatchCallback'),
  removeMatchErrorCallback: jasmine.createSpy('removeMatchErrorCallback'),
  removeMatchEndCallback: jasmine.createSpy('removeMatchEndCallback'),
  getMatchDetails: jasmine.createSpy('getMatchDetails'),
  endTurn: jasmine.createSpy('endTurn'),
  forfeitMatch: jasmine.createSpy('forfeitMatch'),
  connect: jasmine.createSpy('connect'),
  isConnected: jasmine.createSpy('isConnected').and.returnValue(false),
};

const routerMock = {
  navigate: jasmine.createSpy('navigate'),
};

const authServiceMock = {
  hasToken: jasmine.createSpy('hasToken').and.returnValue(true),
  logout: jasmine.createSpy('logout'),
};

const soundServiceMock = {
  clickSoundPath: 'assets/sounds/click.mp3',
};

const playSoundServiceMock = {
  playSound: jasmine.createSpy('playSound'),
};

describe('BattleComponent', () => {
  let component: BattleComponent;
  let fixture: ComponentFixture<BattleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleComponent],
      providers: [
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: WebsocketService, useValue: websocketServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: SoundService, useValue: soundServiceMock },
        { provide: PlaySoundService, useValue: playSoundServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(BattleComponent);
    component = fixture.componentInstance;

    websocketServiceMock.forfeitMatch.calls.reset();
    websocketServiceMock.isConnected.calls.reset();
    websocketServiceMock.isConnected.and.returnValue(false);
    routerMock.navigate.calls.reset();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve enemy target label when ability uses harmful payload field', () => {
    const label = component.getAbilityTargetLabel({ harmful: true } as any);
    expect(label).toBe('ENEMY');
  });

  it('should infer enemy target for offensive skill when harmful flags are stale', () => {
    const label = component.getAbilityTargetLabel({
      isHarmful: false,
      harmful: false,
      damage: 20,
      damageType: 'PIERCING',
      effectType: 'NONE',
    } as any);

    expect(label).toBe('ENEMY');
  });

  it('should return hp tone according to current hp thresholds', () => {
    expect(component.getFighterHpTone({ currentHp: 80 } as any)).toBe('hp-green');
    expect(component.getFighterHpTone({ currentHp: 50 } as any)).toBe('hp-yellow');
    expect(component.getFighterHpTone({ currentHp: 20 } as any)).toBe('hp-red');
  });

  it('should map fighter active effects into visual indicators', () => {
    const fighter = {
      activeEffects: [
        {
          name: 'Destructo Disc',
          imagePath: 'destructo.png',
          remainingTurns: 2,
          isHarmful: true,
        },
      ],
    } as any;

    const indicators = component.getActiveEffectIndicators(fighter);

    expect(indicators.length).toBe(1);
    expect(indicators[0].name).toBe('Destructo Disc');
    expect(indicators[0].remainingTurns).toBe(2);
    expect(indicators[0].harmful).toBeTrue();
  });

  it('should hide invisible effects from the enemy perspective', () => {
    const fighter = {
      activeEffects: [
        {
          name: 'Protect an Ally',
          imagePath: 'protect.png',
          remainingTurns: 1,
          isHarmful: false,
          invisible: true,
        },
      ],
    } as any;

    expect(component.getActiveEffectIndicators(fighter, 'ENEMY')).toEqual([]);
    expect(component.getActiveEffectIndicators(fighter, 'ALLY').length).toBe(1);
  });

  it('should include exposed indicator when fighter cannot become invulnerable', () => {
    const fighter = {
      activeEffects: [],
      unableToBecomeInvulnerable: true,
    } as any;

    const indicators = component.getActiveEffectIndicators(fighter);

    expect(indicators.some((indicator) => indicator.name === 'Exposed' && indicator.harmful)).toBeTrue();
  });

  it('should require explicit self-target confirmation for distance-none skills', () => {
    component.isMyTurn = true;
    component.team = [
      buildFighter('Goku', [
        buildSkill({
          name: 'Block',
          distance: 'NONE',
          effectType: 'DAMAGE_REDUCTION',
          isHarmful: false,
        }),
      ]),
      buildFighter('Krillin'),
      buildFighter('Piccolo'),
    ] as any;
    component.opponentTeam = [
      buildFighter('Vegeta'),
      buildFighter('Nappa'),
      buildFighter('Raditz'),
    ] as any;
    component.myPlayer = {
      userProfile: mockProfile,
      energyPool: {},
      team: component.team as any,
      isCurrentTurn: true,
    } as any;

    component.onSkillClick(0, 0);

    expect(component.pendingSelection).toEqual(jasmine.objectContaining({
      characterIndex: 0,
      skillIndex: 0,
    }));
    expect(component.hasQueuedAction(0)).toBeFalse();
    expect(component.isTargetSelectable('ALLY', 0)).toBeTrue();
    expect(component.isTargetSelectable('ALLY', 1)).toBeFalse();

    component.onFighterClick('ALLY', 0);

    expect(component.pendingSelection).toBeNull();
    expect(component.hasQueuedAction(0)).toBeTrue();
    expect(component.queuedActions[0].targetIndexes).toEqual([0]);
  });

  it('should require explicit primary-target selection for aoe skills even with one valid target', () => {
    component.isMyTurn = true;
    component.team = [
      buildFighter('Vegeta', [
        buildSkill({
          name: 'Galick Gun',
          effectType: 'AOE',
          isHarmful: true,
          damage: 30,
        }),
      ]),
      buildFighter('Nappa'),
      buildFighter('Raditz'),
    ] as any;
    component.opponentTeam = [
      buildFighter('Goku', [], { isAlive: false }),
      buildFighter('Piccolo'),
      buildFighter('Krillin', [], { isAlive: false }),
    ] as any;
    component.myPlayer = {
      userProfile: mockProfile,
      energyPool: {},
      team: component.team as any,
      isCurrentTurn: true,
    } as any;

    component.onSkillClick(0, 0);

    expect(component.pendingSelection).toEqual(jasmine.objectContaining({
      characterIndex: 0,
      skillIndex: 0,
      isHarmful: true,
    }));
    expect(component.hasQueuedAction(0)).toBeFalse();
    expect(component.isTargetSelectable('ENEMY', 0)).toBeFalse();
    expect(component.isTargetSelectable('ENEMY', 1)).toBeTrue();
    expect(component.isTargetSelectable('ENEMY', 2)).toBeFalse();

    component.onFighterClick('ENEMY', 1);

    expect(component.pendingSelection).toBeNull();
    expect(component.hasQueuedAction(0)).toBeTrue();
    expect(component.queuedActions[0].targetIndexes).toEqual([1]);
    expect(component.getTargetName(component.queuedActions[0])).toBe('All Enemies (Piccolo)');
  });

  it('should open surrender confirmation before sending forfeit', () => {
    component.surrenderMatch();

    expect(component.showSurrenderConfirmModal).toBeTrue();
    expect(websocketServiceMock.forfeitMatch).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should only send forfeit after confirming surrender when connected', () => {
    websocketServiceMock.isConnected.and.returnValue(true);
    component.surrenderMatch();

    component.confirmSurrenderMatch();

    expect(component.showSurrenderConfirmModal).toBeFalse();
    expect(component.isSurrenderPending).toBeTrue();
    expect(websocketServiceMock.forfeitMatch).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should not send forfeit when surrender is confirmed while disconnected', () => {
    websocketServiceMock.isConnected.and.returnValue(false);
    component.surrenderMatch();

    component.confirmSurrenderMatch();

    expect(component.showSurrenderConfirmModal).toBeFalse();
    expect(component.isSurrenderPending).toBeFalse();
    expect(websocketServiceMock.forfeitMatch).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should mark victory when winner username matches current user ignoring case', () => {
    localStorage.setItem('username', 'GOKU');

    const onMatchEnd = websocketServiceMock.onMatchEnd.calls.mostRecent().args[0] as (payload: any) => void;
    onMatchEnd({
      id: 1,
      playerOne: { username: 'goku' },
      playerTwo: { username: 'vegeta' },
      winner: { username: 'goku' },
      battleQueueType: 'QUICK',
      battleDate: '2026-04-01 01:30:00',
    });

    expect(component.matchResult).toBe('WIN');

    localStorage.removeItem('username');
  });

  it('should keep user on battle screen when match ends until manual leave action', () => {
    localStorage.setItem('username', 'goku');

    const onMatchEnd = websocketServiceMock.onMatchEnd.calls.mostRecent().args[0] as (payload: any) => void;
    onMatchEnd({
      id: 2,
      playerOne: { username: 'goku' },
      playerTwo: { username: 'vegeta' },
      winner: { username: 'vegeta' },
      battleQueueType: 'QUICK',
      battleDate: '2026-04-01 01:35:00',
    });

    expect(component.matchResult).toBe('LOSS');
    expect(routerMock.navigate).not.toHaveBeenCalled();

    localStorage.removeItem('username');
  });

  it('should clear the live battle snapshot when no active match is returned', () => {
    component.match = {
      playerOne: {} as never,
      playerTwo: {} as never,
      currentPlayer: {} as never,
      turnNumber: 2,
      battleState: 'IN_BATTLE',
      battleQueueType: 'QUICK',
    };
    component.myPlayer = {
      userProfile: mockProfile,
      energyPool: {},
      team: [],
      isCurrentTurn: true,
    };
    component.enemyPlayer = {
      userProfile: { ...mockProfile, username: 'enemy-user' },
      energyPool: {},
      team: [],
      isCurrentTurn: false,
    };
    component.team = [{ character: null, skills: [], currentHp: 100, currentDestructibleDefense: 0, currentDamageReduction: 0, currentBonusDamage: 0, isStunned: false, isUnableToBecomeInvulnerable: false, isInvulnerable: false, isAlive: true }] as never;
    component.opponentTeam = [{ character: null, skills: [], currentHp: 100, currentDestructibleDefense: 0, currentDamageReduction: 0, currentBonusDamage: 0, isStunned: false, isUnableToBecomeInvulnerable: false, isInvulnerable: false, isAlive: true }] as never;

    (component as unknown as { setupMatchSubscription: () => void }).setupMatchSubscription();
    const onMatch = websocketServiceMock.onMatch.calls.mostRecent().args[0] as (payload: MatchResponse | null) => void;
    onMatch(null);

    expect(component.match).toBeNull();
    expect(component.myPlayer).toBeNull();
    expect(component.enemyPlayer).toBeNull();
    expect(component.team.every((fighter) => fighter === null)).toBeTrue();
    expect(component.opponentTeam.every((fighter) => fighter === null)).toBeTrue();
  });

  it('should navigate to character selection only when returnToSelection is invoked', () => {
    component.returnToSelection();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/character-selection']);
  });
});

function buildFighter(
  name: string,
  skills: any[] = [],
  overrides: Partial<any> = {}
): any {
  return {
    character: {
      name,
      imagePath: `${name}.png`,
    },
    skills,
    currentHp: 100,
    currentDestructibleDefense: 0,
    currentDamageReduction: 0,
    currentBonusDamage: 0,
    isStunned: false,
    isUnableToBecomeInvulnerable: false,
    isInvulnerable: false,
    isAlive: true,
    activeEffects: [],
    ...overrides,
  };
}

function buildSkill(overrides: Partial<any> = {}): any {
  return {
    ability: {
      name: 'Test Skill',
      description: 'Test ability',
      imagePath: 'skill.png',
      cost: [],
      cooldown: 0,
      isUnique: false,
      isHarmful: false,
      damage: 0,
      helpingPoints: 0,
      damageType: 'NONE',
      effectType: 'NONE',
      distance: 'MELEE',
      skillType: 'OFFENSIVE',
      persistentType: 'INSTANT',
      durationInTurns: 1,
      classes: [],
      ...overrides,
    },
    currentCooldown: 0,
    isAvailable: () => true,
  };
}
