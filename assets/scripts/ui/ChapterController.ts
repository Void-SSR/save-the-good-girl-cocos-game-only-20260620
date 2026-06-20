import type { StageConfig } from "../data/GameTypes";
import { GameState } from "../core/GameState";

export class ChapterController {
  constructor(private readonly state: GameState, private readonly stages: StageConfig[]) {}

  getChapterCards(): Array<StageConfig & { unlocked: boolean; cleared: boolean }> {
    return this.stages.map((stage) => ({
      ...stage,
      unlocked: this.state.isStageUnlocked(stage.id),
      cleared: this.state.isStageCleared(stage.id)
    }));
  }
}

