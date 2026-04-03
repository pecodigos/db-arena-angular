export interface ActiveEffect {
  name: string;
  description?: string;
  imagePath?: string;
  remainingTurns?: number;
  isHarmful?: boolean;
  harmful?: boolean;
  invisible?: boolean;
  isInvisible?: boolean;
}
