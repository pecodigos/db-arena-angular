import { AuthService } from './auth/auth.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { MatIconModule } from '@angular/material/icon';
import { PreventDragDirective } from './prevent-drag/prevent-drag.directive';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { Subject, filter, takeUntil } from 'rxjs';

interface ShellLink {
  label: string;
  route: string;
  requiresAuth?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
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
    MatDividerModule,
    MatCardModule
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  darkMode = true;
  isDrawerOpened: boolean = false;
  isLoggedIn: boolean = false;
  username: string | null = null;
  private readonly destroy$ = new Subject<void>();

  readonly topNavLinks: ShellLink[] = [
    { label: 'Home', route: '/home' },
    { label: 'Missions', route: '/missions', requiresAuth: true },
    { label: 'Leaderboard', route: '/leaderboards' },
    { label: 'Guide', route: '/game-manual' },
  ];

  readonly drawerLinks: ShellLink[] = [
    { label: 'Profile', route: '/profile', requiresAuth: true },
    { label: 'Clan', route: '/clan', requiresAuth: true },
    { label: 'Change Avatar', route: '/change-avatar', requiresAuth: true },
    { label: 'Change Password', route: '/change-password', requiresAuth: true },
    { label: 'Missions', route: '/missions', requiresAuth: true },
    { label: 'Leaderboard', route: '/leaderboards' },
  ];

  constructor(private authService: AuthService, public router: Router) {
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.hasToken();
    this.updateBodyRouteScope();

    this.authService.isLoggedIn().subscribe(status => {
      this.isLoggedIn = status;
    });

    this.authService.getUsername().subscribe((username) => {
      this.username = username;
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateBodyRouteScope();
        this.closeDrawer();
      });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('in-game-route');
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLogout() {
    this.authService.logout();
    this.closeDrawer();
  }

  get isShellVisible(): boolean {
    const currentRoute = this.router.url.split('?')[0];
    const hiddenRoutes = ['/character-selection', '/battle', '/login', '/register'];
    return !hiddenRoutes.includes(currentRoute);
  }

  shouldRenderLink(link: ShellLink): boolean {
    return !link.requiresAuth || this.isLoggedIn;
  }

  toggleDrawer(event?: Event): void {
    event?.stopPropagation();
    this.isDrawerOpened = !this.isDrawerOpened;
  }

  closeDrawer(): void {
    this.isDrawerOpened = false;
  }

  trackByRoute(_: number, link: ShellLink): string {
    return link.route;
  }

  private updateBodyRouteScope(): void {
    const currentRoute = this.router.url.split(/[?#]/)[0];
    const isInGameRoute = currentRoute === '/character-selection' || currentRoute === '/battle';
    document.body.classList.toggle('in-game-route', isInGameRoute);
  }
}
