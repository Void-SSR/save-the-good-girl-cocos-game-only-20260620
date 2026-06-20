import type { BossConfig, EnemyConfig, StageConfig, UpgradeConfig } from "../data/GameTypes";

export interface GameConfigBundle {
  bosses: BossConfig[];
  stages: StageConfig[];
  enemies: EnemyConfig[];
  upgrades: UpgradeConfig[];
}

export class ConfigService {
  constructor(private readonly bundle: GameConfigBundle) {}

  getStage(stageId: number): StageConfig {
    const stage = this.bundle.stages.find((item) => item.id === stageId);
    if (!stage) {
      throw new Error(`Stage not found: ${stageId}`);
    }
    return stage;
  }

  getBoss(bossId: string): BossConfig {
    const boss = this.bundle.bosses.find((item) => item.id === bossId);
    if (!boss) {
      throw new Error(`Boss not found: ${bossId}`);
    }
    return boss;
  }

  getEnemies(): EnemyConfig[] {
    return this.bundle.enemies;
  }

  getUpgrades(): UpgradeConfig[] {
    return this.bundle.upgrades;
  }
}

