import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-game-manual',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './game-manual.component.html',
  styleUrl: './game-manual.component.scss'
})
export class GameManualComponent {

}
