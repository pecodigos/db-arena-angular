import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-avatar',
  standalone: true,
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './change-avatar.component.html',
  styleUrl: './change-avatar.component.scss'
})
export class ChangeAvatarComponent {
  avatarPath: string = '';

  constructor(private authService: AuthService, private router: Router, private snackBar: MatSnackBar) {}

  async onChangeAvatar() {
    try {
      const response = await firstValueFrom(this.authService.changeAvatar(this.avatarPath));

      if (response) {
        this.snackBar.open('Avatar updated successfully!', 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
      } else {
        this.snackBar.open("Couldn't update avatar. Field was not filled properly.");
      }
    } catch(error) {
      this.snackBar.open('Avatar update failed. Please try again.', 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
    }
  }
}
