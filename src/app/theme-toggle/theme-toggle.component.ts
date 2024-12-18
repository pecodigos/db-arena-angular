import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [ MatIconModule ],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent implements OnInit {
  darkMode: boolean = this.themeService.getDarkMode();

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.setDarkMode(this.darkMode);
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    this.themeService.setDarkMode(this.darkMode);
  }
}
