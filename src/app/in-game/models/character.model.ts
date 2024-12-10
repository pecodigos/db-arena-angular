import { Ability } from "./ability.model";

export interface Character {
  id: number;
  name: string;
  description: string;
  imagePath: string;
  abilities: Ability[];
}
