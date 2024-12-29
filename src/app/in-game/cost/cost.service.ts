import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CostService {

  constructor() { }

  costs = [
    { energyType: "COMBAT", imagePath: `assets/etc/green.png` },
    { energyType: "BLOODLINE", imagePath: `assets/etc/red.png` },
    { energyType: "KI", imagePath: `assets/etc/blue.png` },
    { energyType: "TECHNIQUE", imagePath: `assets/etc/white.png` },
    { energyType: "ANY", imagePath: `assets/etc/black.png` },
  ];

  getArray(amount: number): number[] {
    return amount > 0 ? Array.from({ length: amount }) : [];
  }

  getEnergyImage(energyType: string): string {
    const cost = this.costs.find(c => c.energyType === energyType);
    return cost ? cost.imagePath : '';
  }
}
