import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router, private snackBar: MatSnackBar) {}

  async onLogin() {
    try {
      const response = await firstValueFrom(this.authService.login(this.username, this.password));

      if (response) {
        const { token, userId } = response;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        this.router.navigate(['/home']);
      } else {
        this.snackBar.open('Login failed: Invalid credentials.', 'Close', { duration: 4000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
      }
    } catch(error) {
      this.snackBar.open('Login failed. Please try again.', 'Close', { duration: 4000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
    }
  }
}
