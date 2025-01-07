import { Character } from "./character.interface";

export interface DraggingState {
  isDragging: boolean;
  draggedCharacter: Character | null;
  draggedCharacterIndex: number | null
}
