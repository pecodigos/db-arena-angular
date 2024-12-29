import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlaySoundService {
  private audio: HTMLAudioElement | null = null;

  playSound(soundPath: string): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    if (soundPath) {
      this.audio = new Audio(soundPath);
      this.audio.play();
    } else {
      this.audio = null;
    }
  }

  playLoopSound(soundPath: string): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }

    if (soundPath) {
      this.audio = new Audio(soundPath);
      this.audio.loop = true;
      this.audio.play();
    } else {
      this.audio = null;
    }
  }

  stopSound(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }
}
