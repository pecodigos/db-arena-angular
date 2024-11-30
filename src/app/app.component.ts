import { Component, Renderer2 } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatButtonToggleModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  theme: string = 'light';

  constructor(public router: Router, private renderer: Renderer2) {
    const storedTheme = localStorage.getItem('theme') || 'light';
    this.theme = storedTheme;
    this.applyTheme();
  }

  onThemeChange(theme: string): void {
    this.theme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.theme === 'dark') {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }
}
