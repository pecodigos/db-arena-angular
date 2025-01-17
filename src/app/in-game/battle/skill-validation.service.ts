import { Injectable } from '@angular/core';
import { Skill } from '../interfaces/skill.interface';
import { Fighter } from '../interfaces/fighter.model';
import { EnergyType } from '../interfaces/energy-type.type';
import { EnergyCost } from '../interfaces/energy-cost.interface';
import { Player } from '../interfaces/player.interface';
import { EnergyPool } from '../interfaces/energy-pool.type';
import { CostService } from '../cost/cost.service';

@Injectable({
  providedIn: 'root'
})
export class SkillValidationService {


  constructor(private costService: CostService) {}

  canUseSkill(skill: Skill, fighter: Fighter, player: Player): {
    canUse: boolean;
    reason?: 'COOLDOWN' | 'ENERGY' | 'STUNNED' | 'DEAD' | 'INVULNERABLE' | 'UNABLE_TO_BECOME_INVULNERABLE';
    missingEnergy?: { type: EnergyType; required: number; available: number }[];
  } {
    if (!fighter.isAlive) {
      return { canUse: false, reason: 'DEAD' };
    }

    if (fighter.isStunned) {
      return { canUse: false, reason: 'STUNNED' };
    }

    if (skill.currentCooldown > 0) {
      return { canUse: false, reason: 'COOLDOWN' };
    }

    if (skill.ability.effectType === 'INVULNERABLE' && fighter.isUnableToBecomeInvulnerable) {
      return { canUse: false, reason: 'UNABLE_TO_BECOME_INVULNERABLE' };
    }

    const missingEnergy: { type: EnergyType; required: number; available: number }[] = [];

    for (const cost of skill.ability.cost) {
      const energyType = cost.energyType as EnergyType;
      const availableEnergy = player.energyPool[energyType] || 0;

      if (availableEnergy < cost.amount) {
        missingEnergy.push({
          type: energyType,
          required: cost.amount,
          available: availableEnergy
        });
      }
    }

    if (missingEnergy.length > 0) {
      return {
        canUse: false,
        reason: 'ENERGY',
        missingEnergy
      };
    }

    return { canUse: true };
  }

  getEnergyRequirementDisplay(skill: Skill): string[] {
    return skill.ability.cost.map(cost => {
      const imagePath = this.costService.getEnergyImage(cost.energyType);
      return `${cost.amount}x ${imagePath}`;
    });
  }

  hasEnoughEnergy(player: Player, energyType: EnergyType, amount: number): boolean {
    const available = player.energyPool[energyType] || 0;
    return available >= amount;
  }

  getTotalEnergy(player: Player): number {
    return Object.values(player.energyPool).reduce((sum, current) => sum + (current || 0), 0);
  }

  findOwningPlayer(fighter: Fighter, players: Player[]): Player | null {
    return players.find(player =>
      player.team.some(teamFighter => teamFighter === fighter)
    ) || null;
  }
}
