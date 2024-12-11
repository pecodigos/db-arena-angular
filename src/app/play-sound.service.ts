import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlaySoundService {
  playSound(soundPath: string): void {
    const audio = new Audio(soundPath);
    audio.play().catch((error) => {
      console.error('Failed to play sound:', error);
    });
  }
}
