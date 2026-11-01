/**
 * @vitest-environment jsdom
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";

import { Game } from "../Game/Game.ts";
import { GameState } from "../Game/GameState.ts";
import { SceneIds } from "../Game/Scene.ts";

import { StartScreen } from "./StartScreen.ts";
import { GarageScreen } from "./GarageScreen.ts";
import { LevelSelectScreen } from "./LevelSelectScreen.ts";

describe("Math Racer UI navigation", () => {
  let game: Game;

  beforeEach(() => {
    // Create the HTML container used by our screens.
    document.body.innerHTML = `
      <main id="game">
        <p id="message"></p>
      </main>
    `;

    // Use a fresh game for every test.
    game = new Game(new GameState(null));

    // Register the real UI screens.
    game.register(
      SceneIds.Start,
      (g) => new StartScreen(g)
    );

    game.register(
      SceneIds.Home,
      (g) => new GarageScreen(g)
    );

    game.register(
      SceneIds.LevelSelect,
      (g) => new LevelSelectScreen(g)
    );

    // Register a fake Race scene so we can
    // test Level 1 without changing teammates' code.
    game.register(SceneIds.Race, () => ({
      enter: () => {},
    }));
  });

  afterEach(() => {
    game.stop();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("displays the Start screen", () => {
    game.goTo(SceneIds.Start);

    expect(
      document.getElementById("start-screen")
    ).not.toBeNull();
  });

  it("opens the Garage when Space is pressed", () => {
    game.goTo(SceneIds.Start);

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "Space",
        bubbles: true,
      })
    );

    expect(game.getCurrentSceneId()).toBe(
      SceneIds.Home
    );
  });

  it("does not navigate when another key is pressed", () => {
    game.goTo(SceneIds.Start);

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "Enter",
        bubbles: true,
      })
    );

    expect(game.getCurrentSceneId()).toBe(
      SceneIds.Start
    );
  });

  it("opens Level Selection when LEVELS is clicked", () => {
    game.goTo(SceneIds.Home);

    const levelsButton =
      document.getElementById("levels-button");

    expect(levelsButton).not.toBeNull();

    levelsButton!.click();

    expect(game.getCurrentSceneId()).toBe(
      SceneIds.LevelSelect
    );
  });

  it("returns to Garage when BACK is clicked", () => {
    game.goTo(SceneIds.Home);
    game.goTo(SceneIds.LevelSelect);

    const backButton =
      document.getElementById("back-button");

    expect(backButton).not.toBeNull();

    backButton!.click();

    expect(game.getCurrentSceneId()).toBe(
      SceneIds.Home
    );
  });

  it("opens Race with levelId 1 when LEVEL 1 is clicked", () => {
    game.goTo(SceneIds.LevelSelect);

    const levelOneButton =
      document.getElementById("level-one-button");

    expect(levelOneButton).not.toBeNull();

    const goToSpy = vi.spyOn(game, "goTo");

    levelOneButton!.click();

    expect(goToSpy).toHaveBeenCalledWith(
      SceneIds.Race,
      { levelId: 1 }
    );

    expect(game.getCurrentSceneId()).toBe(
      SceneIds.Race
    );
  });
});
