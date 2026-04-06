const fs = require('fs');
const file = '/mnt/hdd/Code/db-arena/db-arena-java/src/main/java/com/pecodigos/dbarena/ingame/battle/services/EnergyService.java';
let code = fs.readFileSync(file, 'utf8');

const regex = /public static void consumeEnergy\(Map<EnergyType, Integer> playerEnergy, List<AbilityCost> abilityCosts\) \{[\s\S]*?\}\s*\n/m;
const newMethod = `public static void consumeEnergy(Map<EnergyType, Integer> playerEnergy, List<AbilityCost> abilityCosts, Map<EnergyType, Integer> anyEnergyChoices) {
        if (!hasEnoughEnergy(playerEnergy, abilityCosts)) {
            throw new IllegalStateException("Not enough energy to perform this skill");
        }

        int unfulfilledAny = 0;

        for (AbilityCost cost : abilityCosts) {
            EnergyType type = cost.getEnergyType();
            int amount = cost.getAmount();

            if (type == EnergyType.NONE || amount <= 0) {
                continue;
            }

            if (type == EnergyType.ANY) {
                unfulfilledAny += amount;
                continue;
            }

            playerEnergy.compute(type, (k, currentAmount) -> (currentAmount == null ? 0 : currentAmount) - amount);

            if (playerEnergy.get(type) <= 0) {
                playerEnergy.remove(type);
            }
        }
        
        if (unfulfilledAny > 0) {
            if (anyEnergyChoices != null && !anyEnergyChoices.isEmpty()) {
                for (Map.Entry<EnergyType, Integer> entry : anyEnergyChoices.entrySet()) {
                    if (unfulfilledAny <= 0) break;
                    EnergyType type = entry.getKey();
                    int amount = entry.getValue();
                    if (amount > 0) {
                        int available = playerEnergy.getOrDefault(type, 0);
                        int toConsume = Math.min(amount, Math.min(available, unfulfilledAny));
                        
                        if (toConsume > 0) {
                            playerEnergy.compute(type, (k, currentAmount) -> currentAmount - toConsume);
                            if (playerEnergy.get(type) <= 0) playerEnergy.remove(type);
                            unfulfilledAny -= toConsume;
                        }
                    }
                }
            }
            if (unfulfilledAny > 0) {
                consumeAnyEnergy(playerEnergy, unfulfilledAny);
            }
        }
    }
`;

code = code.replace(regex, newMethod);
fs.writeFileSync(file, code);
