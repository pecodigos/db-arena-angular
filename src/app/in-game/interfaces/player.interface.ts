import { EnergyPool } from "./energy-pool.type";
import { Fighter } from "./fighter.model";
import { PublicProfile } from './public-profile.interface';

export interface Player {
  userProfile: PublicProfile;
  energyPool: EnergyPool;
  team: Fighter[];
  isCurrentTurn: boolean;
}
