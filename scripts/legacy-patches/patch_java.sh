sed -i 's/public void useHelpfulSkill(Fighter\[\] targetCharacters, Skill skill)/public void useHelpfulSkill(Fighter\[\] targetCharacters, Skill skill, java.util.Map<com.pecodigos.dbarena.ingame.battle.enums.EnergyType, Integer> anyEnergyChoices)/' /mnt/hdd/Code/db-arena/db-arena-java/src/main/java/com/pecodigos/dbarena/ingame/battle/models/Player.java

sed -i 's/public void useHarmfulSkill(Fighter attacker, Fighter\[\] targetCharacters, Skill skill)/public void useHarmfulSkill(Fighter attacker, Fighter\[\] targetCharacters, Skill skill, java.util.Map<com.pecodigos.dbarena.ingame.battle.enums.EnergyType, Integer> anyEnergyChoices)/' /mnt/hdd/Code/db-arena/db-arena-java/src/main/java/com/pecodigos/dbarena/ingame/battle/models/Player.java

sed -i 's/EnergyService.consumeEnergy(this.energyPool, skill.getAbility().getCost());/EnergyService.consumeEnergy(this.energyPool, skill.getAbility().getCost(), anyEnergyChoices);/g' /mnt/hdd/Code/db-arena/db-arena-java/src/main/java/com/pecodigos/dbarena/ingame/battle/models/Player.java

