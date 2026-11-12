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

    // jsdom has no canvas, so skip drawing the level preview
    vi.spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);

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

    const playButton =
      document.getElementById("level-play-button");

    expect(playButton).not.toBeNull();
    expect(
      document.getElementById("level-title")!.textContent
    ).toBe("LEVEL 1");

    const goToSpy = vi.spyOn(game, "goTo");

    playButton!.click();

    expect(goToSpy).toHaveBeenCalledWith(
      SceneIds.Race,
      { levelId: 1 }
    );

    expect(game.getCurrentSceneId()).toBe(
      SceneIds.Race
    );
  });

  describe("level arrows", () => {
    const title = () =>
      document.getElementById("level-title")!.textContent;
    const click = (id: string) =>
      document.getElementById(id)!.click();

    beforeEach(() => {
      game.goTo(SceneIds.LevelSelect);
    });

    it("the right arrow steps through every level and wraps to the first", () => {
      click("level-next-button");
      expect(title()).toBe("LEVEL 2");
      click("level-next-button");
      expect(title()).toBe("LEVEL 3");
      click("level-next-button");
      expect(title()).toBe("LEVEL 1");
    });

    it("the left arrow wraps from the first level to the last", () => {
      click("level-prev-button");
      expect(title()).toBe("LEVEL 3");
      click("level-prev-button");
      expect(title()).toBe("LEVEL 2");
    });

    it("shows each level's name and description", () => {
      click("level-next-button");
      expect(
        document.getElementById("level-name")!.textContent
      ).toBe("ROOKIE RACEWAY");
      expect(
        document.getElementById("level-description")!.textContent
      ).toBe("MULTIPLICATION WITH FACTORS UP TO 5.");
    });

    it("the arrow keys also change level", () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight" })
      );
      expect(title()).toBe("LEVEL 2");
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft" })
      );
      expect(title()).toBe("LEVEL 1");
    });

    it("clicking the panel races the level being shown", () => {
      click("level-next-button");
      click("level-next-button");
      const goToSpy = vi.spyOn(game, "goTo");

      click("level-play-button");

      expect(goToSpy).toHaveBeenCalledWith(
        SceneIds.Race,
        { levelId: 3 }
      );
    });

    it("stops listening for arrow keys after leaving", () => {
      click("level-play-button");
      expect(() =>
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight" })
        )
      ).not.toThrow();
      expect(game.getCurrentSceneId()).toBe(SceneIds.Race);
    });
  });
});
