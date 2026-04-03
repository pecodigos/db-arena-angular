const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /public isTargetSelectable\(side: TeamSide, fighterIndex: number\): boolean \{[\s\S]*?const fighter = this\.getFighterBySide\(side, fighterIndex\);\n\s*return  sed -n '606,620p' /mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.tsfighter && this\.isFighterAlive\(fighter\);\n\s*\}/;

const newMethod = \`public isTargetSelectable(side: TeamSide, fighterIndex: number): boolean {
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

    if (this.pendingSelection.isHarmful && this.isFighterInvulnerable(fighter)) {
      return false;
    }

    return true;
  }\`;

code = code.replace(regex, newMethod);

if (!code.includes('isFighterInvulnerable')) {
    code = code.replace(/public isFighterAlive\(fighter: Fighter\): boolean \{/,
\`public isFighterInvulnerable(fighter: Fighter | null): boolean {
    if (!fighter) return false;
    const rawFighter = fighter as any;
    return  sed -n '606,620p' /mnt/hdd/Code/db-arena/db-arena-angular/src/app/in-game/battle/battle.component.tsrawFighter.invulnerable || !!rawFighter.isInvulnerable;
  }

  public isFighterAlive(fighter: Fighter): boolean {\`);
}

fs.writeFileSync(file, code);
