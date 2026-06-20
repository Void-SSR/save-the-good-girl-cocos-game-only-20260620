import type { BattleSnapshot, EnemyConfig, StageConfig, UpgradeConfig } from "../data/GameTypes";

interface EnemyRuntime {
  id: string;
  hp: number;
  maxHp: number;
  y: number;
  speed: number;
  damage: number;
  xp: number;
}

interface BossRuntime {
  hp: number;
  maxHp: number;
}

export class BattleModel {
  private mode: BattleSnapshot["mode"] = "ready";
  private timeSec = 0;
  private baseHp: number;
  private heroLevel = 1;
  private kills = 0;
  private xp = 0;
  private xpToNext = 30;
  private fireTimer = 0;
  private spawnTimer = 0;
  private boss: BossRuntime | null = null;
  private enemies: EnemyRuntime[] = [];
  private damage = 54;
  private fireInterval = 0.3;
  private extraProjectiles = 0;
  private splashRadius = 0;
  private splashRatio = 0;
  private auraDps = 0;
  private upgradeChoices: UpgradeConfig[] = [];

  constructor(
    private readonly stage: StageConfig,
    private readonly enemiesConfig: EnemyConfig[],
    private readonly upgrades: UpgradeConfig[]
  ) {
    this.baseHp = stage.baseHp;
  }

  start(): void {
    this.mode = "running";
  }

  step(deltaSec: number): void {
    if (this.mode !== "running") {
      return;
    }

    this.timeSec += deltaSec;
    this.spawnTimer -= deltaSec;
    this.fireTimer -= deltaSec;

    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(0.42, 1.18 - this.timeSec / 140);
    }

    if (!this.boss && this.timeSec >= this.stage.bossAtSec) {
      this.boss = { hp: 39000, maxHp: 39000 };
      this.mode = "boss-alert";
      return;
    }

    for (const enemy of this.enemies) {
      enemy.y += enemy.speed * deltaSec;
      if (this.auraDps > 0 && enemy.y > 620) {
        enemy.hp -= this.auraDps * deltaSec;
      }
    }

    const leaked = this.enemies.filter((enemy) => enemy.y >= 1180);
    for (const enemy of leaked) {
      this.baseHp -= enemy.damage;
    }
    this.enemies = this.enemies.filter((enemy) => enemy.y < 1180 && enemy.hp > 0);

    if (this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = this.fireInterval;
    }

    this.collectDeadEnemies();

    if (this.baseHp <= 0) {
      this.baseHp = 0;
      this.mode = "defeat";
    }

    if (this.boss && this.boss.hp <= 0) {
      this.boss.hp = 0;
      this.mode = "victory";
    }
  }

  resumeBossFight(): void {
    if (this.mode === "boss-alert") {
      this.mode = "running";
    }
  }

  chooseUpgrade(index: number): void {
    if (this.mode !== "upgrade") {
      return;
    }
    const upgrade = this.upgradeChoices[index] ?? this.upgradeChoices[0];
    if (upgrade) {
      this.applyUpgrade(upgrade);
    }
    this.upgradeChoices = [];
    this.mode = "running";
  }

  getSnapshot(): BattleSnapshot {
    return {
      mode: this.mode,
      stageId: this.stage.id,
      timeSec: Number(this.timeSec.toFixed(2)),
      baseHp: Math.ceil(this.baseHp),
      heroLevel: this.heroLevel,
      kills: this.kills,
      xp: Math.floor(this.xp),
      xpToNext: this.xpToNext,
      bossSpawned: Boolean(this.boss),
      bossHp: Math.max(0, Math.ceil(this.boss?.hp ?? 0)),
      bossMaxHp: this.boss?.maxHp ?? 0,
      enemyCount: this.enemies.length,
      upgradeChoices: this.upgradeChoices.map((item) => item.id),
      currentCompanionId: null,
      companionCooldownSec: 0,
      bossPhase: this.boss ? (this.mode === "victory" ? "purified" : "corrupted") : "none",
      triggeredStoryNode: null
    };
  }

  private spawnEnemy(): void {
    const pick = this.enemiesConfig[(this.kills + Math.floor(this.timeSec)) % this.enemiesConfig.length];
    const pressure = 1 + this.timeSec / 220;
    this.enemies.push({
      id: pick.id,
      hp: pick.hp * pressure,
      maxHp: pick.hp * pressure,
      y: -40,
      speed: pick.speed,
      damage: pick.damage,
      xp: pick.xp
    });
  }

  private shoot(): void {
    const projectileCount = 1 + this.extraProjectiles;
    for (let i = 0; i < projectileCount; i += 1) {
      const target = this.enemies.sort((a, b) => b.y - a.y)[0];
      if (target) {
        target.hp -= this.damage;
        if (this.splashRadius > 0) {
          for (const enemy of this.enemies) {
            if (enemy !== target && Math.abs(enemy.y - target.y) <= this.splashRadius) {
              enemy.hp -= this.damage * this.splashRatio;
            }
          }
        }
        continue;
      }
      if (this.boss) {
        this.boss.hp -= this.damage * 0.72;
      }
    }
  }

  private collectDeadEnemies(): void {
    const dead = this.enemies.filter((enemy) => enemy.hp <= 0);
    if (dead.length === 0) {
      return;
    }
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
    for (const enemy of dead) {
      this.kills += 1;
      this.xp += enemy.xp;
    }
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.heroLevel += 1;
      this.xpToNext += 18;
      this.upgradeChoices = this.pickUpgrades();
      this.mode = "upgrade";
    }
  }

  private pickUpgrades(): UpgradeConfig[] {
    const offset = this.heroLevel % this.upgrades.length;
    return [0, 1, 2].map((index) => this.upgrades[(offset + index) % this.upgrades.length]);
  }

  private applyUpgrade(upgrade: UpgradeConfig): void {
    const effects = upgrade.effects;
    if (effects.fireIntervalMultiplier) {
      this.fireInterval *= effects.fireIntervalMultiplier;
    }
    if (effects.damageMultiplier) {
      this.damage *= effects.damageMultiplier;
    }
    if (effects.extraProjectiles) {
      this.extraProjectiles += effects.extraProjectiles;
    }
    if (effects.splashRadius) {
      this.splashRadius = Math.max(this.splashRadius, effects.splashRadius);
      this.splashRatio = Math.max(this.splashRatio, effects.splashRatio ?? 0.25);
    }
    if (effects.baseHpBonus) {
      this.baseHp += effects.baseHpBonus;
    }
    if (effects.auraDps) {
      this.auraDps = Math.max(this.auraDps, effects.auraDps);
    }
  }
}
