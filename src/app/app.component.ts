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
  constructor(public router: Router, private renderer: Renderer2) {}

  isDarkMode = false;

  toggleTheme(isDarkMode: boolean) {
    this.isDarkMode = isDarkMode;

    const themeClass = isDarkMode ? 'dark-theme ' : 'light-theme';
    this.renderer.removeClass(document.body, isDarkMode ? 'light-theme' : 'dark-theme');
    this.renderer.addClass(document.body, themeClass);
  }
}
