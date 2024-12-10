import { Cost } from "./cost.model";

export interface Ability {
  name: string;
  description: string;
  imagePath: string;
  cost: Cost[];
  classes: string[];
  cooldown: number;
}
