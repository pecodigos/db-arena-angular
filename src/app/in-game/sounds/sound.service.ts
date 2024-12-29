import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {

  constructor() { }

  clickSoundPath: string = 'assets/sounds/click.mp3';
  searchingSoundPath: string = 'assets/sounds/searching.mp3';
  stopSearchSoundPath: string = 'assets/sounds/close-search.mp3';
  matchFoundSoundPath: string = 'assets/sounds/foundmatch.mp3';
  openContainerSoundPath: string = 'assets/sounds/open-container.mp3';
  closeContainerSoundPath: string = 'assets/sounds/close-container.mp3';
}
