import { Cost } from "./cost.interface";

export interface Ability {
  name: string;
  description: string;
  imagePath: string;
  cost: Cost[];
  classes: string[];
  cooldown: number;
}
