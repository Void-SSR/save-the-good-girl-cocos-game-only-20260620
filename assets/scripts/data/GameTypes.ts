export type ScreenId = "boot" | "lobby" | "chapters" | "formation" | "codex" | "shop" | "battle" | "result";

export interface BossConfig {
  id: string;
  chapter: number;
  name: string;
  age: number;
  scene: string;
  outfitFamily: string;
  corruptedKeywords: string[];
  purifiedKeywords: string[];
  background: string;
  corruptionCause?: string;
  purifiedRole?: string;
  companionSkill?: CompanionSkillConfig;
  corruptedPrompt: string;
  purifiedPrompt: string;
}

export interface CompanionSkillConfig {
  id: string;
  name: string;
  description: string;
  cooldownSec: number;
}

export interface StageConfig {
  id: number;
  name: string;
  bossId: string;
  danger: string;
  theme: string;
  durationSec: number;
  bossAtSec: number;
  baseHp: number;
  rewardGold: number;
  rewardTicket: number;
  description: string;
  unlockRequirement: string | null;
}

export interface EnemyConfig {
  id: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  xp: number;
  radius: number;
  spawnWeight: number;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic";
  description: string;
  effects: Partial<{
    fireIntervalMultiplier: number;
    damageMultiplier: number;
    extraProjectiles: number;
    splashRadius: number;
    splashRatio: number;
    baseHpBonus: number;
    auraDps: number;
  }>;
}

export interface PlayerProgress {
  gold: number;
  tickets: number;
  clearedStages: number[];
  purifiedBosses: string[];
  selectedCompanionId: string | null;
  lastStageId: number;
  viewedStoryNodes: string[];
}

export interface ChapterStoryConfig {
  stageId: number;
  bossId: string;
  opening: string[];
  bossEntrance: string[];
  battleLines: string[];
  purification: string[];
  companionJoin: string[];
  mysteryHint: string[];
}

export interface StoryConfigBundle {
  chapters: ChapterStoryConfig[];
}

export interface BattleSnapshot {
  mode: "ready" | "running" | "upgrade" | "boss-alert" | "victory" | "defeat";
  stageId: number;
  timeSec: number;
  baseHp: number;
  heroLevel: number;
  kills: number;
  xp: number;
  xpToNext: number;
  bossSpawned: boolean;
  bossHp: number;
  bossMaxHp: number;
  enemyCount: number;
  upgradeChoices: string[];
  currentCompanionId: string | null;
  companionCooldownSec: number;
  bossPhase: "none" | "corrupted" | "purifying" | "purified";
  triggeredStoryNode: string | null;
}
