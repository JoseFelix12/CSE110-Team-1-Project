
import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";

export class MiniGameSelectScreen implements Scene {
  private screen: HTMLElement | null = null;

  constructor(private game: Game) {}

  enter(_params: SceneParams): void {
    const screen = document.createElement("section");

    screen.className = "screen";
    screen.id = "mini-game-select-screen";

    Object.assign(screen.style, {
      position: "relative",
      width: "100%",
      aspectRatio: "1440 / 1024",
      maxWidth: "1440px",
      margin: "0 auto",
      overflow: "hidden",
      backgroundColor: "#252525",
    });

    // Your new Mini Games artwork
    const image = document.createElement("img");
    image.src = "/images/minigamescreen.png";
    image.alt = "Math Racer Mini Games";
    image.loading = "eager";
    image.decoding = "sync";

    Object.assign(image.style, {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "fill",
      pointerEvents: "none",
    });

    screen.appendChild(image);

    // Invisible clickable areas over your artwork
    const hotspot = (
      label: string,
      left: string,
      top: string,
      width: string,
      height: string,
      onClick: () => void,
      disabled = false
    ): HTMLButtonElement => {
      const button = document.createElement("button");

      button.className = "hotspot";
      button.setAttribute("aria-label", label);
      button.disabled = disabled;

      Object.assign(button.style, {
        position: "absolute",
        left,
        top,
        width,
        height,
        padding: "0",
        border: "none",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        zIndex: "10",
      });

      button.addEventListener("click", onClick);
      screen.appendChild(button);

      return button;
    };

    hotspot("Back to Garage", "2%", "2%", "17%", "9%",
  () => this.game.goTo(SceneIds.Home));

    // CATCH THE ANSWER — left card
    hotspot(
      "Play Catch the Answer",
      "10%",
      "34%",
      "38%",
      "44%",
      () => this.game.goTo(SceneIds.MiniGame1)
    );

    
hotspot(
  "Play Repair Solver",
  "53%", "34%", "38%", "44%",
  () => this.game.goTo(SceneIds.MiniGame2)
);


    document.getElementById("game")!.appendChild(screen);

    this.screen = screen;
  }

  exit(): void {
    this.screen?.remove();
    this.screen = null;
  }
}
