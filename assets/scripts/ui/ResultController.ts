import { GameState } from "../core/GameState";
import type { BossConfig, StageConfig } from "../data/GameTypes";

export class ResultController {
  constructor(private readonly state: GameState) {}

  applyVictory(stage: StageConfig, boss: BossConfig): void {
    this.state.markStageCleared(stage.id, boss.id, stage.rewardGold, stage.rewardTicket);
  }
}

