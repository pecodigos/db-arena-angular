import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { PreventDragDirective } from '../../prevent-drag.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    PreventDragDirective
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router, private snackBar: MatSnackBar) {}

  async onRegister() {
    try {
      const response = await firstValueFrom(
        this.authService.register(this.username, this.email, this.password)
      );
      if (response) {
        this.router.navigate(['/login']);
      } else {
        this.snackBar.open('Registration failed: Fields not filled properly.', 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
      }
    } catch(error) {
      this.snackBar.open('Registration failed. Please try again.', 'Close', { duration: 5000, verticalPosition: 'bottom', panelClass: 'custom-snackbar' });
    }
  }
}
