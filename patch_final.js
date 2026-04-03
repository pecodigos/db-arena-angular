const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.html';
const text = fs.readFileSync(file, 'utf8');

let count = 0;
let res = text.replace(/<div class="custom-effect-tooltip">\s*<div class="tooltip-title">{{ effect\.name \| uppercase }}<\/div>\s*<div class="tooltip-desc" \*ngIf="effect\.description">{{ effect\.description \| uppercase }}<\/div>\s*<div class="tooltip-turns">{{ effect\.remainingTurns > 0 \? effect\.remainingTurns \+ ' TURN' \+ \(effect\.remainingTurns > 1 \? 'S' : ''\) : 'INFINITE' }}<\/div>\s*<\/div>/g, function() {
    count++;
    return `<div class="custom-effect-tooltip">
                        <div class="tooltip-content-wrapper">
                          <div class="tooltip-left">
                            <img *ngIf="effect.imagePath" [src]="effect.imagePath" [alt]="effect.name" class="tooltip-image" />
                            <div class="tooltip-fallback" *ngIf="!effect.imagePath">{{ effect.name.charAt(0) }}</div>
                          </div>
                          <div class="tooltip-right">
                            <div class="tooltip-header">
                              <span class="tooltip-title">{{ effect.name | uppercase }}</span>
                              <span class="tooltip-turns" *ngIf="effect.remainingTurns > 0">{{ effect.remainingTurns + (effect.remainingTurns > 1 ? ' TURNS' : ' TURN') }}</span>
                              <span class="tooltip-turns" *ngIf="effect.remainingTurns === 0">INFINITE</span>
                            </div>
                            <div class="tooltip-desc" *ngIf="effect.description">{{ effect.description | uppercase }}</div>
                          </div>
                        </div>
                      </div>`;
});

console.log("Found:", count);
fs.writeFileSync(file, res);
