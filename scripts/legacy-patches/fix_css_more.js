const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.scss';
let scss = fs.readFileSync(file, 'utf8');

const regexTooltip = /\.custom-effect-tooltip\s*\{[\s\S]*?\}/;

const newTooltipStyles = \`.custom-effect-tooltip {
  display: none;
  position: absolute;
  top: 100%;
  left: 0%;
  width: max-content;
  max-width: 20rem;
  background-color: #f1ebd8;
  border: 2px solid #b31c19;
  color: black;
  padding: 0.5rem 0.6rem;
  font-family: 'Libre Franklin', monospace;
  font-size: 0.65rem;
  z-index: 1000;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  pointer-events: none;
}\`;

scss = scss.replace(regexTooltip, newTooltipStyles);

// Remove the `::before` pseudo element as the backend string should contain commas/hyphens or we can just leave it as text
scss = scss.replace(/\.tooltip-desc::before\s*\{[\s\S]*?\}\s*/, '');

fs.writeFileSync(file, scss);
