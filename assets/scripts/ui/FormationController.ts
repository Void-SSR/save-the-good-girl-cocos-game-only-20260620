import type { BossConfig } from "../data/GameTypes";
import { GameState } from "../core/GameState";

export class FormationController {
  constructor(private readonly state: GameState, private readonly bosses: BossConfig[]) {}

  getAvailableCompanions(): BossConfig[] {
    return this.bosses.filter((boss) => this.state.progress.purifiedBosses.includes(boss.id));
  }

  selectCompanion(id: string): boolean {
    if (!this.state.progress.purifiedBosses.includes(id)) {
      return false;
    }
    this.state.progress.selectedCompanionId = id;
    return true;
  }
}

