const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.html';
let html = fs.readFileSync(file, 'utf8');

const regex = /<div class="custom-effect-tooltip"><b>\{\{ effect.name \}\}<\/b><span \*ngIf="effect.description"><br>\{\{ effect.description \}\}<\/span><span \*ngIf="effect.remainingTurns > 0"><br><i>Continues for \{\{ effect.remainingTurns \}\} turns<\/i><\/span><\/div>/g;

const newTooltip = `<div class="custom-effect-tooltip">
                  <div class="tooltip-title">{{ effect.name | uppercase }}</div>
                  <div class="tooltip-desc" *ngIf="effect.description">{{ effect.description | uppercase }}</div>
                  <div class="tooltip-turns">{{ effect.remainingTurns > 0 ? effect.remainingTurns + ' TURN' + (effect.remainingTurns > 1 ? 'S' : '') : 'INFINITE' }}</div>
                </div>`;

html = html.replace(regex, newTooltip);
fs.writeFileSync(file, html);
