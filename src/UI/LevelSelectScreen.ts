import type { Game } from "../Game/Game.ts";
import type { LevelConfig } from "../Game/gameConfig.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";
import { drawThemePreview } from "../RacingScreen/RaceClassView.ts";

/**
 * LevelSelectScreen - Shows one level at a time. The arrows (or the left and
 * right arrow keys) flip between levels, and clicking the panel races it.
 * The level's title, preview and description are drawn over levels.png.
 */
export class LevelSelectScreen implements Scene {
  private game: Game;
  private screen: HTMLElement | null = null;
  private levels: LevelConfig[] = [];
  private index = 0;

  private title: HTMLElement | null = null;
  private preview: HTMLCanvasElement | null = null;
  private name: HTMLElement | null = null;
  private description: HTMLElement | null = null;
  private playButton: HTMLButtonElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  enter(_params: SceneParams): void {
    this.levels = this.game.state.getLevels();
    this.index = 0;

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

    const prevButton = document.createElement("button");
    prevButton.id = "level-prev-button";
    prevButton.className = "hotspot level-prev";
    prevButton.setAttribute("aria-label", "Previous level");
    prevButton.addEventListener("click", () => this.showLevel(this.index - 1));

    const nextButton = document.createElement("button");
    nextButton.id = "level-next-button";
    nextButton.className = "hotspot level-next";
    nextButton.setAttribute("aria-label", "Next level");
    nextButton.addEventListener("click", () => this.showLevel(this.index + 1));

    // These cover the Level 1 text and picture baked into levels.png
    const title = document.createElement("div");
    title.id = "level-title";
    title.className = "level-title";

    const preview = document.createElement("canvas");
    preview.id = "level-preview";
    preview.className = "level-preview";

    const name = document.createElement("div");
    name.id = "level-name";
    name.className = "level-name";

    const description = document.createElement("div");
    description.id = "level-description";
    description.className = "level-description";

    const playButton = document.createElement("button");
    playButton.id = "level-play-button";
    playButton.className = "hotspot level-play";
    playButton.addEventListener("click", () => {
      this.game.goTo(SceneIds.Race, { levelId: this.levels[this.index].id });
    });

    screen.append(image, title, preview, name, description, backButton, prevButton, nextButton, playButton);
    document.getElementById("game")!.appendChild(screen);
    document.addEventListener("keydown", this.handleKeyDown);

    this.screen = screen;
    this.title = title;
    this.preview = preview;
    this.name = name;
    this.description = description;
    this.playButton = playButton;
    this.showLevel(0);
  }

  exit(): void {
    document.removeEventListener("keydown", this.handleKeyDown);
    this.screen?.remove();
    this.screen = null;

    const message = document.getElementById("message");
    if (message) message.textContent = "";
  }

  /**
   * Shows the level at index, wrapping from the last level back to the first
   */
  private showLevel(index: number): void {
    const count = this.levels.length;
    this.index = ((index % count) + count) % count;
    const level = this.levels[this.index];

    this.title!.textContent = `LEVEL ${level.id}`;
    this.name!.textContent = level.name.toUpperCase();
    this.description!.textContent = level.description.toUpperCase();
    this.playButton!.setAttribute("aria-label", `Play level ${level.id}: ${level.name}`);
    drawThemePreview(this.preview!, level.theme);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "ArrowLeft") {
      this.showLevel(this.index - 1);
    } else if (event.key === "ArrowRight") {
      this.showLevel(this.index + 1);
    }
  };
}
