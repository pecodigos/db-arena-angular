import { Player } from './player.interface';
import { PublicProfile } from './public-profile.interface';

export interface MatchSnapshot {
  playerOne: Player;
  playerTwo: Player;
  currentPlayer: Player;
  turnNumber: number;
  battleState: string;
  battleQueueType: string;
}

export interface MatchResponse {
  match: MatchSnapshot;
  opponentData: PublicProfile;
}

export interface MatchEndResponse {
  id: number;
  playerOne: PublicProfile;
  playerTwo: PublicProfile;
  winner: PublicProfile;
  battleQueueType: string;
  battleDate: string;
}
