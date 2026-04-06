const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.scss';
let css = fs.readFileSync(file, 'utf8');

const regex = /\.any-energy-panel \{[\s\S]*?\}/;
const newPanel = `.any-energy-panel {
  width: 100%;
  padding: 1rem 0;
  margin-top: 1rem;
  border-top: 2px dashed rgb(196, 127, 0);
  color: black;
  font-family: 'Libre Franklin', monospace;
  position: relative;
  text-align: center;
}`;

css = css.replace(regex, newPanel);

// Also remove .any-energy-modal totally
css = css.replace(/\.any-energy-modal\s*\{[\s\S]*?\}\s*/, '');
// And remove .any-energy-actions
css = css.replace(/\.any-energy-actions\s*\{[\s\S]*?\}\s*/, '');
// And .ability-preview
css = css.replace(/\.ability-preview\s*\{[\s\S]*?\}\s*/, '');

fs.writeFileSync(file, css);
