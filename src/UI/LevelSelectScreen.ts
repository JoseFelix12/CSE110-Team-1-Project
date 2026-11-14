
import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";

export class LevelSelectScreen implements Scene {
  private screen: HTMLElement | null = null;
  private selectedIndex = 0;

  constructor(private game: Game) {}

  enter(_params: SceneParams): void {
    this.selectedIndex = 0;

    const screen = document.createElement("section");
    screen.className = "screen";
    screen.id = "level-select-screen";
    this.screen = screen;

    // Your new Levels artwork
    const image = document.createElement("img");
    image.src = "/images/LEVELS%20SCREEN.png";
    image.alt = "Math Racer Level Selection";
    image.loading = "eager";
    image.decoding = "sync";
    screen.appendChild(image);

    // Load the pixel font
    if (!document.getElementById("levels-arcade-font")) {
      const link = document.createElement("link");
      link.id = "levels-arcade-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
      document.head.appendChild(link);
    }

    const font = '"Press Start 2P", monospace';

    const hotspot = (
      label: string,
      left: string,
      top: string,
      width: string,
      height: string,
      onClick: () => void
    ): HTMLButtonElement => {
      const button = document.createElement("button");
      button.className = "hotspot";
      button.setAttribute("aria-label", label);

      Object.assign(button.style, {
        position: "absolute",
        left,
        top,
        width,
        height,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        zIndex: "20",
      });

      button.addEventListener("click", onClick);
      screen.appendChild(button);
      return button;
    };

   // Back button
  hotspot("Back", "2.5%", "2%", "18%", "10%", () => {
  this.game.goTo(SceneIds.Home);
  });

    // Real level data
    const levels = this.game.state.getLevels();

    // Dynamic LEVEL 1, LEVEL 2, etc.
    // Positioned over the blank title area in your artwork.
    const levelTitle = document.createElement("div");

    Object.assign(levelTitle.style, {
      position: "absolute",
      left: "28%",
      top: "36%",
      width: "44%",
      textAlign: "center",
      fontFamily: font,
      fontSize: "clamp(14px, 2.8vw, 35px)",
      color: "#FFFFFF",
      textShadow: "3px 3px #000000",
      zIndex: "8",
      pointerEvents: "none",
    });

    screen.appendChild(levelTitle);

    // Display the level name and lock status.
    const levelInfo = document.createElement("div");

    Object.assign(levelInfo.style, {
      position: "absolute",
      left: "29%",
      top: "68%",
      width: "42%",
      textAlign: "center",
      fontFamily: font,
      fontSize: "clamp(7px, 1vw, 12px)",
      lineHeight: "1.8",
      color: "#FFFFFF",
      textShadow: "2px 2px #000000",
      zIndex: "8",
      pointerEvents: "none",
    });

    screen.appendChild(levelInfo);

    // Invisible button over the center level preview.
    const playButton = hotspot(
      "Play selected level",
      "28%",
      "30%",
      "44%",
      "49%",
      () => {
        const level = levels[this.selectedIndex];

        if (!level.unlocked) {
          return;
        }

        this.game.goTo(SceneIds.Race, {
          levelId: level.id,
        });
      }
    );

    const updateDisplay = (): void => {
      const level = levels[this.selectedIndex];

      levelTitle.textContent = `LEVEL ${level.id}`;

      levelInfo.textContent = level.unlocked
        ? `${level.name.toUpperCase()} - PLAY!`
        : `${level.name.toUpperCase()} - LOCKED`;

      levelInfo.style.color = level.unlocked
        ? "#59FF72"
        : "#FF6666";

      playButton.style.cursor = level.unlocked
        ? "pointer"
        : "not-allowed";

      playButton.setAttribute(
        "aria-label",
        level.unlocked
          ? `Play Level ${level.id}`
          : `Level ${level.id} locked`
      );
    };

    // Left arrow
    hotspot(
      "Previous level",
      "20%",
      "47%",
      "8%",
      "18%",
      () => {
        this.selectedIndex =
          (this.selectedIndex - 1 + levels.length) %
          levels.length;

        updateDisplay();
      }
    );

    // Right arrow
    hotspot(
      "Next level",
      "72%",
      "47%",
      "8%",
      "18%",
      () => {
        this.selectedIndex =
          (this.selectedIndex + 1) % levels.length;

        updateDisplay();
      }
    );

    document.getElementById("game")!.appendChild(screen);

    updateDisplay();
  }

  exit(): void {
    this.screen?.remove();
    this.screen = null;
  }
}
