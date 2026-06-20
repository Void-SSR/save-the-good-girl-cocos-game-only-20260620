import type { EnemyConfig } from "../data/GameTypes";

export class EnemySpawner {
  constructor(private readonly enemies: EnemyConfig[]) {}

  getWeightedEnemy(seed: number): EnemyConfig {
    const total = this.enemies.reduce((sum, enemy) => sum + enemy.spawnWeight, 0);
    let cursor = seed % total;
    for (const enemy of this.enemies) {
      cursor -= enemy.spawnWeight;
      if (cursor <= 0) {
        return enemy;
      }
    }
    return this.enemies[0];
  }
}

