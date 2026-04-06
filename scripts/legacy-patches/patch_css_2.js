const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.scss';
let scss = fs.readFileSync(file, 'utf8');

scss = scss.replace(/\.effect-chip\s*\{/, '.effect-chip {\n  pointer-events: auto;');

fs.writeFileSync(file, scss);
