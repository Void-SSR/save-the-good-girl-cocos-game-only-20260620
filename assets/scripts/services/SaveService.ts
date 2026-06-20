import type { PlayerProgress } from "../data/GameTypes";

const SAVE_KEY = "save_the_good_girl_minigame_progress_v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class SaveService {
  constructor(private readonly storage: StorageLike) {}

  load(defaultProgress: PlayerProgress): PlayerProgress {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) {
      return defaultProgress;
    }
    try {
      return { ...defaultProgress, ...JSON.parse(raw) } as PlayerProgress;
    } catch {
      return defaultProgress;
    }
  }

  save(progress: PlayerProgress): void {
    this.storage.setItem(SAVE_KEY, JSON.stringify(progress));
  }

  clear(): void {
    this.storage.removeItem(SAVE_KEY);
  }
}

