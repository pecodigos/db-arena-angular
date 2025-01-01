import { Cost } from "./cost.interface";
import { DamageType } from "../enums/damage-type.enum";
import { Distance } from "../enums/distance.enum";
import { EffectType } from "../enums/effect-type.enum";
import { PersistentType } from "../enums/persistent-type.enum";
import { SkillType } from "../enums/skill-type.enum";

export interface Ability {
  name: string;
  description: string;
  imagePath: string;
  cost: Cost[];
  cooldown: number;
  isUnique: boolean;
  isHarmful: boolean;
  damage: number;
  helpingPoints: number;
  damageType: DamageType;
  effectType: EffectType;
  distance: Distance;
  skillType: SkillType;
  persistentType: PersistentType;
  durationInTurns: number;
  classes: string[];
}
