import { Ability } from "./ability.interface";

export interface Skill {
  ability: Ability;
  currentCooldown: number;
  isAvailable(): boolean;
}
