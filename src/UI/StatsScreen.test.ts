/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Game } from "../Game/Game.ts";
import { GameState } from "../Game/GameState.ts";
import { SceneIds } from "../Game/Scene.ts";
import { StatsScreen } from "./StatsScreen.ts";

describe("Stats screen navigation", () => {
  let game: Game;

  beforeEach(() => {
    document.body.innerHTML = '<main id="game"></main>';

    game = new Game(new GameState(null));

    game.register(SceneIds.Stats, (g) => new StatsScreen(g));

    game.register(SceneIds.LevelSelect, () => ({
      enter: () => {},
    }));

    game.register(SceneIds.Race, () => ({
      enter: () => {},
    }));
  });

  afterEach(() => {
    game.stop();
    document.body.innerHTML = "";
  });

  it("returns to Level Selection instead of the race", () => {
    game.goTo(SceneIds.Race);
    game.goTo(SceneIds.Stats, { mode: "race", stars: 2 });

    const backButton = Array.from(
      document.querySelectorAll("#stats-screen button")
    ).find((button) => button.textContent?.includes("BACK"));

    expect(backButton).toBeDefined();

    (backButton as HTMLButtonElement).click();

    expect(game.getCurrentSceneId()).toBe(SceneIds.LevelSelect);
  });
});
