import { Character } from "./character.interface";
import { Skill } from "./skill.interface";
import { ActiveEffect } from "./active-effect.interface";

export class Fighter {
  static readonly MAX_HP = 100;
  character!: Character | null;
  skills: Skill[] = [];
  currentHp: number = Fighter.MAX_HP;
  currentDestructibleDefense: number = 0;
  currentDamageReduction: number = 0;
  damageReductionTurns?: number;
  currentBonusDamage: number = 0;
  bonusDamageTurns?: number;
  isStunned: boolean = false;
  stunTurns?: number;
  isUnableToBecomeInvulnerable: boolean = false;
  isInvulnerable: boolean = false;
  invulnerableTurns?: number;
  isAlive: boolean = true;
  activeEffects?: ActiveEffect[];
}
