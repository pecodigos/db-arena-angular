import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-change-avatar',
  standalone: true,
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './change-avatar.component.html',
  styleUrl: './change-avatar.component.scss'
})
export class ChangeAvatarComponent {

}
