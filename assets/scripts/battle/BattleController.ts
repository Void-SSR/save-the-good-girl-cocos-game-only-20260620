import { BattleModel } from "./BattleModel";
import type { BattleSnapshot } from "../data/GameTypes";

export class BattleController {
  private model: BattleModel | null = null;

  mount(model: BattleModel): void {
    this.model = model;
    this.model.start();
  }

  update(deltaSec: number): BattleSnapshot | null {
    this.model?.step(deltaSec);
    return this.model?.getSnapshot() ?? null;
  }

  confirmBossAlert(): void {
    this.model?.resumeBossFight();
  }

  chooseUpgrade(index: number): void {
    this.model?.chooseUpgrade(index);
  }
}

