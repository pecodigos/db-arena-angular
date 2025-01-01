import { BattleQueueType } from "../enums/battle-queue-type.enum";
import { Fighter } from "./fighter.model";

export interface SearchMatchRequest {
  team: Fighter[];
  battleQueueType: BattleQueueType;
}
