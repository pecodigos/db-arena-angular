import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClassesMapper {
  constructor() { }

  mapToClasses(ability: any): string[] {
    return [
      ability.skillType,
      ability.distance,
      ability.persistentType
    ].filter((value: string) => value && value !== "NONE");
  }
}
