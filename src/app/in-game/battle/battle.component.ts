import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PreventDragDirective } from '../../prevent-drag.directive';

@Component({
  selector: 'app-battle',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    PreventDragDirective
  ],
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.scss'
})
export class BattleComponent {
  player = {
    username: 'PECODIGOS',
    fighterRank: 'SAIYAN'
  }

  opponent = {
    username: 'ZECODIGOS',
    fighterRank: 'LAST BOSS'
  }
}
