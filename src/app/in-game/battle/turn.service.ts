import { Injectable } from '@angular/core';
import { Player } from '../interfaces/player.interface';

@Injectable({
  providedIn: 'root'
})
export class TurnService {

  playerOne: Player | null = null;
  playerTwo: Player | null = null;

  constructor() { }
}
