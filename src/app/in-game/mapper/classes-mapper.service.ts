import { Injectable } from '@angular/core';
import { Ability } from '../interfaces/ability.interface';

@Injectable({
  providedIn: 'root'
})
export class ClassesMapper {
  constructor() { }

  mapToClasses(ability: Ability): string[] {
    return [
      ability.skillType,
      ability.distance,
      ability.persistentType
    ].filter((value: string) => value && value !== "NONE");
  }
}
