import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";

export class StartScreen implements Scene {
  private game: Game;
  private screen: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  enter(_params: SceneParams): void {
    const screen = document.createElement("section");
    screen.className = "screen";
    screen.id = "start-screen";

    const image = document.createElement("img");
    image.src = "/images/start.png";
    image.alt = "Math Racer Start Screen";

    screen.appendChild(image);
    document.getElementById("game")!.appendChild(screen);

    this.screen = screen;
    document.addEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Space") {
      event.preventDefault();
      this.game.goTo(SceneIds.Home);
    }
  };

  exit(): void {
    document.removeEventListener("keydown", this.handleKeyDown);
    this.screen?.remove();
    this.screen = null;
  }
}
