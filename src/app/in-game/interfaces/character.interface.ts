import { Ability } from "./ability.interface";

export interface Character {
  id: number;
  name: string;
  description: string;
  imagePath: string;
  abilities: Ability[];
}
