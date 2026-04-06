const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.scss';
let text = fs.readFileSync(file, 'utf8');

const regex = /\.custom-effect-tooltip\s*\{[\s\S]*?\.effect-harmful\s*\{\s*border-color:\s*rgb\(156,\s*18,\s*18\);\s*\}/g;

const newCss = `.custom-effect-tooltip {
  display: none;
  position: absolute;
  top: 130%;
  left: 0%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 14rem;
  background-color: #f1ebd8;
  border: 2px solid #b31c19;
  color: black;
  padding: 0.5rem;
  font-family: 'Libre Franklin', monospace;
  font-size: 0.65rem;
  text-transform: none;
  line-height: 1.3;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  pointer-events: none;
}

.tooltip-content-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  text-align: left;
}

.tooltip-left {
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid #000;
  background-color: #ccc;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tooltip-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tooltip-fallback {
  font-weight: 700;
  font-size: 1rem;
  color: #333;
}

.tooltip-right {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.tooltip-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.2rem;
}

.tooltip-title {
  font-weight: 800;
  font-size: 0.65rem;
  color: #b31c19;
}

.tooltip-separator {
  color: #000;
  font-weight: 800;
  margin: 0 0.1rem;
}

.tooltip-turns {
  font-weight: 800;
  color: #000;
  font-size: 0.65rem;
  white-space: nowrap;
}

.tooltip-desc {
  font-size: 0.60rem;
  white-space: pre-line;
  font-weight: 600;
  color: #333;
}

.effect-chip:hover .custom-effect-tooltip {
  display: block;
}

.effect-helpful { border-color: rgb(4, 114, 42); }
.effect-harmful { border-color: rgb(156, 18, 18); }`;

let count = 0;
text = text.replace(regex, function() {
    count++;
    return newCss;
});

console.log("Replaced instances:", count);

fs.writeFileSync(file, text);
