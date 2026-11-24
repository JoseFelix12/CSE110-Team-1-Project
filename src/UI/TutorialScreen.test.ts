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

import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import { TutorialScreen } from "./TutorialScreen.ts";

describe("Tutorial Screen", () => {
  let screen: TutorialScreen;
  let goTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = '<main id="game"></main>';

    goTo = vi.fn();

    const game = {
      goTo,
    } as unknown as Game;

    screen = new TutorialScreen(game);
    screen.enter({});
  });

  afterEach(() => {
    screen.exit();
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  const getImage = (): HTMLImageElement => {
    return document.querySelector<HTMLImageElement>(
      "#tutorial-screen img"
    )!;
  };

  const getButton = (label: string): HTMLButtonElement => {
    return document.querySelector<HTMLButtonElement>(
      `#tutorial-screen button[aria-label="${label}"]`
    )!;
  };

  it("opens the tutorial on page 1", () => {
    expect(
      document.getElementById("tutorial-screen")
    ).not.toBeNull();

    expect(getImage().src).toContain("TUTORIAL1.png");

    expect(getImage().alt).toBe(
      "Math Racer Tutorial - Page 1"
    );
  });

  it("moves to page 2 when NEXT is clicked", () => {
    getButton("Next").click();

    expect(getImage().src).toContain("TUTORIAL2.png");

    expect(getImage().alt).toBe(
      "Math Racer Tutorial - Page 2"
    );
  });

  it("hides NEXT on the last page", () => {
    getButton("Next").click();

    expect(getButton("Next").style.display).toBe("none");
  });

  it("returns to page 1 when BACK is clicked on page 2", () => {
    getButton("Next").click();
    getButton("Back").click();

    expect(getImage().src).toContain("TUTORIAL1.png");

    expect(getButton("Next").style.display).toBe("block");

    expect(goTo).not.toHaveBeenCalled();
  });

  it("returns to Home when BACK is clicked on page 1", () => {
    getButton("Back").click();

    expect(goTo).toHaveBeenCalledWith(SceneIds.Home);
  });

  it("removes the tutorial when exiting and resets when reopened", () => {
    getButton("Next").click();

    screen.exit();

    expect(
      document.getElementById("tutorial-screen")
    ).toBeNull();

    screen.enter({});

    expect(getImage().src).toContain("TUTORIAL1.png");
    expect(getImage().alt).toBe(
      "Math Racer Tutorial - Page 1"
    );
  });
});
