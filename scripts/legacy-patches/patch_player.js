const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-java/src/main/java/com/pecodigos/dbarena/ingame/battle/models/Player.java';
let code = fs.readFileSync(file, 'utf8');

const regex = /activeEffects\.add\(new ActiveEffect\([\s\S]*?,\s*harmful\s*\)\);/;
const replacement = `activeEffects.add(new ActiveEffect(
                    ability.getName(),
                    ability.getDescription(),
                    ability.getImagePath(),
                    durationInTurns,
                    harmful,
                    Boolean.TRUE.equals(ability.getIsInvisible())
            ));`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
