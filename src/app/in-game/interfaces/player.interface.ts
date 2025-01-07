import { EnergyPool } from "./energy-pool.interface";
import { Fighter } from "./fighter.model";

export interface Player {
  userProfile: {
    username: string;
  };
  energyPool: EnergyPool;
  team: Fighter[];
  isCurrentTurn: boolean;
}
