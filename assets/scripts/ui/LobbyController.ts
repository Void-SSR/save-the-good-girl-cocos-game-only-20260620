import { GameState } from "../core/GameState";

export class LobbyController {
  constructor(private readonly state: GameState) {}

  getViewModel(): { gold: number; tickets: number; recommendedStageId: number; clearedCount: number } {
    return {
      gold: this.state.progress.gold,
      tickets: this.state.progress.tickets,
      recommendedStageId: this.state.progress.lastStageId,
      clearedCount: this.state.progress.clearedStages.length
    };
  }
}

