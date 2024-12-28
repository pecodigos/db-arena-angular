import { Character } from "./character.interface";

export interface Fighter {
  character: Character;
  currentHp: number;
  currentDestructibleDefense: number;
  currentDamageReduction: number;
  currentBonusDamage: number;
  isStunned: boolean;
  isUnableToBecomeInvulnerable: boolean;
  isInvulnerable: boolean;
  isAlive: boolean;
}
