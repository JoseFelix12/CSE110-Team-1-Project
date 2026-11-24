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
import { RepairSolverScreen } from "./RepairSolverScreen.ts";
import { WrongAnswersScreen } from "./WrongAnswersScreen.ts";

// Use predictable questions so we can test the UI.
vi.mock("../Game/RepairMinigame.ts", () => ({
  RepairMinigame: class {
    generateQuestion() {
      return {
        text: "2 + 3 = ?",
        a: 2,
        b: 3,
        operator: "addition",
        answer: 5,
      };
    }

    generateAnswerChoices() {
      return { choices: [5, 6, 7, 8] };
    }

    getCarStatus() {
      return "100%";
    }

    fixCar() {}
  },
}));

// Fake audio so tests don't play actual music.
let audioInstances: FakeAudio[] = [];

class FakeAudio {
  src: string;
  loop = false;
  muted = false;
  volume = 1;
  currentTime = 0;

  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();

  constructor(src: string) {
    this.src = src;
    audioInstances.push(this);
  }
}

describe("Repair Solver Screen", () => {
  let game: Game;
  let screen: RepairSolverScreen;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("Audio", FakeAudio);

    audioInstances = [];
    document.body.innerHTML = '<main id="game"></main>';

    game = new Game(new GameState(null));

    game.register(
      SceneIds.WrongAnswers,
      (g) => new WrongAnswersScreen(g)
    );

    game.register(SceneIds.MiniGameSelect, () => ({
      enter: () => {},
    }));

    screen = new RepairSolverScreen(game);
    screen.enter({});
  });

  afterEach(() => {
    screen.exit();
    game.stop();
    document.body.innerHTML = "";

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const getAudio = (src: string): FakeAudio => {
    const audio = audioInstances.find(
      (instance) => instance.src === src
    );

    if (!audio) {
      throw new Error(`Audio not found: ${src}`);
    }

    return audio;
  };

  const clickAnswer = (answer: string): void => {
    const button = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        "#repair-solver-screen button"
      )
    ).find((button) => button.textContent?.trim() === answer);

    if (!button) {
      throw new Error(`Answer button not found: ${answer}`);
    }

    button.click();
  };

  const clickButton = (label: string): void => {
    const button = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        "#repair-solver-screen button"
      )
    ).find((button) => button.textContent?.includes(label));

    if (!button) {
      throw new Error(`Button not found: ${label}`);
    }

    button.click();
  };

  const finishGame = (firstAnswer = "5"): void => {
    for (let i = 0; i < 10; i++) {
      clickAnswer(i === 0 ? firstAnswer : "5");
      vi.advanceTimersByTime(500);
    }
  };

  it("starts background music when the game opens", () => {
    const music = getAudio("/sounds/repair-music.mp3");

    expect(music.play).toHaveBeenCalledTimes(1);
    expect(music.loop).toBe(true);
    expect(music.volume).toBe(0.15);
  });

  it("plays the correct sound for a correct answer", () => {
    clickAnswer("5");

    const sound = getAudio("/sounds/Correct.mp3");

    expect(sound.play).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain(
      "CORRECT! +20 HEALTH"
    );
  });

  it("plays the incorrect sound for a wrong answer", () => {
    clickAnswer("6");

    const sound = getAudio("/sounds/Incorrect.mp3");

    expect(sound.play).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain(
      "WRONG! -10 HEALTH"
    );
  });

  it("stops the music when exiting", () => {
    const music = getAudio("/sounds/repair-music.mp3");

    screen.exit();

    expect(music.pause).toHaveBeenCalled();
    expect(music.currentTime).toBe(0);
    expect(
      document.getElementById("repair-solver-screen")
    ).toBeNull();
  });

  it("shows results and stops music after 10 questions", () => {
    finishGame();

    const music = getAudio("/sounds/repair-music.mp3");

    expect(document.body.textContent).toContain(
      "PERFECT REPAIR!"
    );
    expect(document.body.textContent).toContain(
      "CORRECT: 10/10"
    );
    expect(document.body.textContent).toContain(
      "REVIEW WRONG ANSWERS"
    );
    expect(music.pause).toHaveBeenCalled();
  });

  it("opens Wrong Answers Review with the missed answer", () => {
    // First answer is wrong, remaining nine are correct.
    finishGame("6");

    clickButton("REVIEW WRONG ANSWERS");

    expect(game.getCurrentSceneId()).toBe(
      SceneIds.WrongAnswers
    );

    expect(document.body.textContent).toContain(
      "QUESTION 1 OF 1"
    );
    expect(document.body.textContent).toContain(
      "2 + 3 = ?"
    );
    expect(document.body.textContent).toContain(
      "YOUR ANSWER"
    );
    expect(document.body.textContent).toContain(
      "CORRECT ANSWER"
    );
    expect(document.body.textContent).toContain(
      "BACK TO MINI GAMES"
    );
  });

  it("restarts the game when PLAY AGAIN is clicked", () => {
    finishGame();

    clickButton("PLAY AGAIN");

    expect(document.body.textContent).toContain(
      "QUESTION 1/10"
    );
    expect(document.body.textContent).not.toContain(
      "PERFECT REPAIR!"
    );

    const music = getAudio("/sounds/repair-music.mp3");

    expect(music.play).toHaveBeenCalledTimes(2);
  });

    it("pauses and resumes the game", () => {
    const music = getAudio("/sounds/repair-music.mp3");
    music.pause.mockClear();

    clickButton("PAUSE");

    const menu = document.querySelector<HTMLElement>(
      ".race-pause"
    )!;

    expect(menu.hidden).toBe(false);
    expect(music.pause).toHaveBeenCalledTimes(1);

    // Answers cannot be selected while paused.
    clickAnswer("5");

    expect(getAudio("/sounds/Correct.mp3").play)
      .not.toHaveBeenCalled();

    clickButton("Resume");

    expect(menu.hidden).toBe(true);
    expect(music.play).toHaveBeenCalledTimes(2);

    expect(document.body.textContent).toContain(
      "QUESTION 1/10"
    );

    // Answers work again after resuming.
    clickAnswer("5");

    expect(getAudio("/sounds/Correct.mp3").play)
      .toHaveBeenCalledTimes(1);
  });

  it("mutes and unmutes all game audio", () => {
    clickButton("PAUSE");
    clickButton("Mute Audio");

    expect(getAudio("/sounds/repair-music.mp3").muted)
      .toBe(true);
    expect(getAudio("/sounds/Correct.mp3").muted)
      .toBe(true);
    expect(getAudio("/sounds/Incorrect.mp3").muted)
      .toBe(true);

    clickButton("Unmute Audio");

    expect(getAudio("/sounds/repair-music.mp3").muted)
      .toBe(false);
    expect(getAudio("/sounds/Correct.mp3").muted)
      .toBe(false);
    expect(getAudio("/sounds/Incorrect.mp3").muted)
      .toBe(false);
  });

  it("preserves the question delay while paused", () => {
    clickAnswer("5");

    vi.advanceTimersByTime(200);

    clickButton("PAUSE");

    vi.advanceTimersByTime(10000);

    expect(document.body.textContent).toContain(
      "QUESTION 1/10"
    );

    clickButton("Resume");

    vi.advanceTimersByTime(299);

    expect(document.body.textContent).toContain(
      "QUESTION 1/10"
    );

    vi.advanceTimersByTime(1);

    expect(document.body.textContent).toContain(
      "QUESTION 2/10"
    );
  });

  it("returns to Mini Games when Quit is clicked", () => {
    clickButton("PAUSE");
    clickButton("Quit");

    expect(game.getCurrentSceneId()).toBe(
      SceneIds.MiniGameSelect
    );
  });
});
