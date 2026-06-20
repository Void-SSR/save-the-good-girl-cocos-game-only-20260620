import { GameState } from "./GameState";
import { SceneRouter } from "./SceneRouter";

export class AppRoot {
  public readonly state = new GameState();
  public readonly router = new SceneRouter(this.state);

  start(): void {
    this.router.go("lobby");
  }
}

