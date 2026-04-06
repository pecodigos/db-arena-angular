const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.ts';
let ts = fs.readFileSync(file, 'utf8');

ts = ts.replace(/public isTargetSelectable\(side: TeamSide, fighterIndex: number\): boolean \{[\s\S]*?return  cat /mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/interfaces/fighter.model.tsfighter && this\.isFighterAlive\(fighter\);\s*\}/, 
`public isTargetSelectable(side: TeamSide, fighterIndex: number): boolean {
    if (!this.pendingSelection) {
      return false;
    }

    const validSide = this.pendingSelection.isHarmful ? 'ENEMY' : 'ALLY';
    if (side !== validSide) {
      return false;
    }

    const fighter = this.getFighterBySide(side, fighterIndex);
    if (!fighter || !this.isFighterAlive(fighter)) {
      return false;
    }

    // Characters with invulnerability cannot be targeted
    if (fighter.isInvulnerable) {
      return false;
    }

    return true;
  }`);

fs.writeFileSync(file, ts);
