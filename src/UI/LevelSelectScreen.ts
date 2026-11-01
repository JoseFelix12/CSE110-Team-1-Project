import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";

export class LevelSelectScreen implements Scene {
  private game: Game;
  private screen: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  enter(_params: SceneParams): void {
    const screen = document.createElement("section");
    screen.className = "screen";
    screen.id = "level-select-screen";

    const image = document.createElement("img");
    image.src = "/images/levels.png";
    image.alt = "Math Racer Level Selection";

    const backButton = document.createElement("button");
    backButton.id = "back-button";
    backButton.className = "hotspot levels-back";
    backButton.setAttribute("aria-label", "Back");

    backButton.addEventListener("click", () => {
      this.game.back();
    });

    const levelOneButton = document.createElement("button");
    levelOneButton.id = "level-one-button";
    levelOneButton.className = "hotspot level-one";
    levelOneButton.setAttribute("aria-label", "Level 1");

    levelOneButton.addEventListener("click", () => {
    this.game.goTo(SceneIds.Race, { levelId: 1 });
    });

    screen.append(image, backButton, levelOneButton);
    document.getElementById("game")!.appendChild(screen);

    this.screen = screen;
  }

  exit(): void {
    this.screen?.remove();
    this.screen = null;

    const message = document.getElementById("message");
    if (message) message.textContent = "";
  }
}
