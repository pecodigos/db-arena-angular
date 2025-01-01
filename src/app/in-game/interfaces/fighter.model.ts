import { Character } from "./character.interface";
import { Skill } from "./skill.interface";

export class Fighter {
  static readonly MAX_HP = 100;
  character!: Character | null;
  skills: Skill[] = [];
  currentHp: number = Fighter.MAX_HP;
  currentDestructibleDefense: number = 0;
  currentDamageReduction: number = 0;
  currentBonusDamage: number = 0;
  isStunned: boolean = false;
  isUnableToBecomeInvulnerable: boolean = false;
  isInvulnerable: boolean = false;
  isAlive: boolean = true;
}
