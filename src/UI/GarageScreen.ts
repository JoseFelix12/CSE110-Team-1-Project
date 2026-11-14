
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

    // Original Garage background
    const image = document.createElement("img");
    image.src = "/images/garage.png";
    image.alt = "Math Racer Garage";

    // LEVELS - existing left button
    const levelsButton = document.createElement("button");
    levelsButton.id = "levels-button";
    levelsButton.className = "hotspot garage-levels";
    levelsButton.setAttribute("aria-label", "Levels");

    levelsButton.addEventListener("click", () => {
      this.game.goTo(SceneIds.LevelSelect);
    });

    // MINI GAMES - invisible button over the middle box
    const miniGamesButton = document.createElement("button");
    miniGamesButton.id = "mini-games-button";
    miniGamesButton.className = "hotspot";
    miniGamesButton.setAttribute("aria-label", "Mini Games");

    Object.assign(miniGamesButton.style, {
      position: "absolute",
      left: "36%",
      top: "34%",
      width: "24%",
      height: "27%",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      zIndex: "10",
    });

    miniGamesButton.addEventListener("click", () => {
      this.game.goTo(SceneIds.MiniGameSelect);
    });

    // Add everything to the Garage screen
    screen.append(
      image,
      levelsButton,
      miniGamesButton
    );

    document.getElementById("game")!.appendChild(screen);

    this.screen = screen;
  }

  exit(): void {
    this.screen?.remove();
    this.screen = null;
  }
}
