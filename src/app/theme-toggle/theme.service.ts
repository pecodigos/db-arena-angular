import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = false;

  constructor() {
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    this.applyTheme();
  }

  getDarkMode():boolean {
    return this.darkMode;
  }

  setDarkMode(darkMode: boolean) {
    this.darkMode = darkMode;
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(this.darkMode ? 'dark-theme' : 'light-theme');
  }
}
