const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.html';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove the standalone "Any Energy Modal"
code = code.replace(/<!-- Any Energy Selection Overlay -->[\s\S]*<\/main>/, '</main>');

// 2. Insert inline energy selection inside the turn queue right before queue-buttons-enhanced
const randomEnergySection = `
          <!-- Any Energy Selection Inline -->
          <div class="any-energy-panel" *ngIf="anyEnergyRequiredTotal > 0">
            <h2 class="any-energy-title">CHOOSE {{ anyEnergyRequiredTotal }} RANDOM ENERGY</h2>
            
            <div class="any-energy-columns">
              <div class="column left">
                <h3 class="column-title">ENERGY LEFT:</h3>
                <div class="energy-row" *ngFor="let energy of availableEnergiesForAny">
                  <span class="energy-icon-wrapper" [ngClass]="energy.class"></span>
                  <span class="energy-name">{{ energy.type }}</span>
                  <span class="energy-val">{{ energy.available - energy.selected }}</span>
                </div>
              </div>

              <div class="column center">
                <h3 class="column-title">&nbsp;</h3>
                <div class="energy-row controls" *ngFor="let energy of availableEnergiesForAny">
                  <button class="control-btn" (click)="decrementAnyEnergy(energy)">-</button>
                  <button class="control-btn" (click)="incrementAnyEnergy(energy)">+</button>
                </div>
              </div>

              <div class="column right">
                <h3 class="column-title">SELECTED ENERGY:</h3>
                <div class="energy-row" *ngFor="let energy of availableEnergiesForAny">
                  <span class="energy-icon-wrapper" [ngClass]="energy.class"></span>
                  <span class="energy-name">{{ energy.type }}</span>
                  <span class="energy-val selected-val">{{ energy.selected }}</span>
                </div>
              </div>
            </div>
          </div>
`;

code = code.replace(/<\/ng-template>\s*<div class="queue-buttons-enhanced">/, 
  `</ng-template>\n${randomEnergySection}\n\n          <div class="queue-buttons-enhanced">`);

fs.writeFileSync(file, code);
