import { Ability } from "./ability.interface";

export class Skill {
  ability!: Ability;
  currentCooldown: number = 0;
}
