import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-game-manual',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    RouterLink
  ],
  templateUrl: './game-manual.component.html',
  styleUrl: './game-manual.component.scss'
})
export class GameManualComponent {

}
