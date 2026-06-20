import type { PlayerProgress, ScreenId } from "../data/GameTypes";

export class GameState {
  public screen: ScreenId = "boot";

  public progress: PlayerProgress = {
    gold: 0,
    tickets: 0,
    clearedStages: [],
    purifiedBosses: [],
    selectedCompanionId: null,
    lastStageId: 1,
    viewedStoryNodes: []
  };

  setScreen(screen: ScreenId): void {
    this.screen = screen;
  }

  isStageCleared(stageId: number): boolean {
    return this.progress.clearedStages.includes(stageId);
  }

  isStageUnlocked(stageId: number): boolean {
    return stageId === 1 || this.isStageCleared(stageId - 1);
  }

  markStageCleared(stageId: number, bossId: string, rewardGold: number, rewardTicket: number): void {
    if (!this.progress.clearedStages.includes(stageId)) {
      this.progress.clearedStages.push(stageId);
    }
    if (!this.progress.purifiedBosses.includes(bossId)) {
      this.progress.purifiedBosses.push(bossId);
    }
    this.progress.gold += rewardGold;
    this.progress.tickets += rewardTicket;
    this.progress.lastStageId = Math.min(stageId + 1, 10);
  }

  reset(): void {
    this.screen = "boot";
    this.progress = {
      gold: 0,
      tickets: 0,
      clearedStages: [],
      purifiedBosses: [],
      selectedCompanionId: null,
      lastStageId: 1,
      viewedStoryNodes: []
    };
  }
}
