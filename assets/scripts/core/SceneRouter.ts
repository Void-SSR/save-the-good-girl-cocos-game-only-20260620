import type { ScreenId } from "../data/GameTypes";
import { GameState } from "./GameState";

export type RouteListener = (screen: ScreenId) => void;

export class SceneRouter {
  private listeners: RouteListener[] = [];

  constructor(private readonly state: GameState) {}

  onChange(listener: RouteListener): void {
    this.listeners.push(listener);
  }

  go(screen: ScreenId): void {
    this.state.setScreen(screen);
    for (const listener of this.listeners) {
      listener(screen);
    }
  }
}

