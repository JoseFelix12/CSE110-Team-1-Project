import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";

export class GarageScreen implements Scene {
  private game: Game;
  private screen: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  enter(_params: SceneParams): void {
    const screen = document.createElement("section");
    screen.className = "screen";
    screen.id = "garage-screen";

    const image = document.createElement("img");
    image.src = "/images/garage.png";
    image.alt = "Math Racer Garage";

    const levelsButton = document.createElement("button");
    levelsButton.id = "levels-button";
    levelsButton.className = "hotspot garage-levels";
    levelsButton.setAttribute("aria-label", "Levels");

    levelsButton.addEventListener("click", () => {
      this.game.goTo(SceneIds.LevelSelect);
    });

    screen.append(image, levelsButton);
    document.getElementById("game")!.appendChild(screen);

    this.screen = screen;
  }

  exit(): void {
    this.screen?.remove();
    this.screen = null;
  }
}
