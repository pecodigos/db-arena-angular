import { Injectable } from '@angular/core';
import { Player } from '../interfaces/player.interface';

@Injectable({
  providedIn: 'root'
})
export class TurnService {

  playerOne: Player | null = null;
  playerTwo: Player | null = null;

  constructor() { }

  setPlayers(playerOne: Player, playerTwo: Player): void {
    this.playerOne = playerOne;
    this.playerTwo = playerTwo;
  }

  endTurn(): void {
    if (this.playerOne?.isCurrentTurn) {
      this.playerOne.isCurrentTurn = false;
      this.playerTwo!.isCurrentTurn = true;
    } else {
      this.playerOne!.isCurrentTurn = true;
      this.playerTwo!.isCurrentTurn = false;
    }
  }
}
