import { AuthService } from './auth/auth.service';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { MatIconModule } from '@angular/material/icon';
import { PreventDragDirective } from './prevent-drag.directive';
import { MatDividerModule } from '@angular/material/divider';

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
    MatSlideToggleModule,
    FormsModule,
    ThemeToggleComponent,
    MatIconModule,
    PreventDragDirective,
    MatDividerModule
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  darkMode = true;
  isDrawerOpened: boolean = true;
  isLoggedIn: boolean = false;
  username: string | null = null;

  constructor(private authService: AuthService, public router: Router) {
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.hasToken();

    this.authService.isLoggedIn().subscribe(status => {
      this.isLoggedIn = status;
    });

    this.authService.getUsername().subscribe((username) => {
      this.username = username;
    })
  }

  onLogout() {
    this.authService.logout();
  }

  toggleDrawer(): void {
    this.isDrawerOpened = !this.isDrawerOpened;
  }
}
