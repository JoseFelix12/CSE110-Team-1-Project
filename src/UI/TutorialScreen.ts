import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";

export class TutorialScreen implements Scene {
  private game: Game;
  private screen: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  enter(_params: SceneParams): void {
    let currentPage = 0;

    const pages = [
      "/images/TUTORIAL1.png",
      "/images/TUTORIAL2.png",
    ];

    const screen = document.createElement("section");
    screen.className = "screen";
    screen.id = "tutorial-screen";

    const image = document.createElement("img");
    image.src = pages[0];
    image.alt = "Math Racer Tutorial - Page 1";

    const makeHotspot = (
      label: string,
      left: string,
      top: string,
      width: string,
      height: string,
      onClick: () => void
    ) => {
      const button = document.createElement("button");
      button.className = "hotspot";
      button.setAttribute("aria-label", label);

      Object.assign(button.style, {
        position: "absolute",
        left,
        top,
        width,
        height,
        background: "transparent",
        border: "none",
        padding: "0",
        cursor: "pointer",
        zIndex: "10",
      });

      button.addEventListener("click", onClick);
      return button;
    };

    const backButton = makeHotspot(
      "Back",
      "2%",
      "2%",
      "12%",
      "9%",
      () => {
        if (currentPage === 0) {
          this.game.goTo(SceneIds.Home);
        } else {
          currentPage = 0;
          updatePage();
        }
      }
    );

    const nextButton = makeHotspot(
      "Next",
      "77%",
      "79%",
      "19%",
      "12%",
      () => {
        currentPage = 1;
        updatePage();
      }
    );

    const updatePage = () => {
      image.src = pages[currentPage];
      image.alt = `Math Racer Tutorial - Page ${currentPage + 1}`;

      nextButton.style.display =
        currentPage === 0 ? "block" : "none";
    };

    screen.append(image, backButton, nextButton);

    document.getElementById("game")!.appendChild(screen);
    this.screen = screen;
  }

  exit(): void {
    this.screen?.remove();
    this.screen = null;
  }
}
