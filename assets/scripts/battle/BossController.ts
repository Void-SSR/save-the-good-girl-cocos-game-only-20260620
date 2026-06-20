export interface BossRuntimeState {
  id: string;
  hp: number;
  maxHp: number;
  alerted: boolean;
}

export class BossController {
  createBoss(id: string, maxHp: number): BossRuntimeState {
    return {
      id,
      hp: maxHp,
      maxHp,
      alerted: true
    };
  }
}

