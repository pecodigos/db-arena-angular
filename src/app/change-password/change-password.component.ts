import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatCardModule,
    MatInputModule,
    FormsModule,
    CommonModule,
    MatButtonModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private authService: AuthService, private router: Router, private snackBar: MatSnackBar) {}

  async onUpdate() {
    if (this.newPassword !== this.confirmPassword) {
      this.snackBar.open("Your new password and its confirmation doesn't match.", 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
      return;
    }

    try {
      const response = await firstValueFrom(this.authService.changePassword(this.currentPassword, this.newPassword));

      if (response) {
        this.snackBar.open('Password changed successfully', 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar'});
        window.location.reload();
      } else {
        this.snackBar.open('Failed to change password. Fields not filled properly.', 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
      }
    } catch(error) {
      this.snackBar.open('Password update failed. Please try again.', 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
    }
  }
}
