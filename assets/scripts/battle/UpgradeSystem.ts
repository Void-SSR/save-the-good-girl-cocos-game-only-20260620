import type { UpgradeConfig } from "../data/GameTypes";

export class UpgradeSystem {
  constructor(private readonly upgrades: UpgradeConfig[]) {}

  pickThree(level: number): UpgradeConfig[] {
    const offset = level % this.upgrades.length;
    return [0, 1, 2].map((index) => this.upgrades[(offset + index) % this.upgrades.length]);
  }
}

