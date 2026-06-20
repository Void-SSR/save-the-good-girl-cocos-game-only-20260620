export interface ProjectileTuning {
  damage: number;
  fireInterval: number;
  extraProjectiles: number;
  splashRadius: number;
  splashRatio: number;
}

export function createDefaultProjectileTuning(): ProjectileTuning {
  return {
    damage: 54,
    fireInterval: 0.3,
    extraProjectiles: 0,
    splashRadius: 0,
    splashRatio: 0
  };
}

