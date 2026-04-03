import { BattleQueueType } from "../enums/battle-queue-type.enum";

export interface SearchMatchRequest {
  characterIds: number[];
  battleQueueType: BattleQueueType;
}
