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
import type { LaneGameController } from "../LaneGame/LaneGameController.ts";
import type { LaneGameModel } from "../LaneGame/LaneGameModel.ts";
import { SceneIds } from "../Game/Scene.ts";
import { CatchTheAnswer } from "./LaneGameScreen.ts";

// Fake audio so tests don't play actual sounds.
let audioInstances: FakeAudio[] = [];

class FakeAudio {
  src: string;
  loop = false;
  volume = 1;
  currentTime = 0;

  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();

  constructor(src: string) {
    this.src = src;
    audioInstances.push(this);
  }
}

const missedAnswers = [
  {
    question: {
      text: "8 + 5 = ?",
      a: 8,
      b: 5,
      operator: "addition",
      answer: 13,
    },
    playerAnswer: "12",
  },
];

// Fake controller and model so we only test the screen.
const makeController = () => ({
  startGame: vi.fn(),
  generateRound: vi.fn(),
  handleLaneSelection: vi.fn(),
  handleCarMovement: vi.fn(),
  getWrongAnswers: vi.fn(() => missedAnswers),
});

const makeModel = () => ({
  getTargetAnswer: vi.fn(() => 13),
  getLanes: vi.fn(() => [
    { getQuestion: () => ({ text: "8 + 5 = ?" }) },
    { getQuestion: () => ({ text: "6 + 7 = ?" }) },
    { getQuestion: () => ({ text: "9 + 3 = ?" }) },
  ]),
  getCurrentLane: vi.fn(() => ({
    getLaneNumber: () => 2,
  })),
  getScore: vi.fn(() => 30),
  getCorrectCount: vi.fn(() => 3),
});

const makeGame = () => ({
  state: {
    addCoins: vi.fn(),
    getCoins: vi.fn(() => 100),
  },
  goTo: vi.fn(),
  back: vi.fn(),
});

const originalAnimate = Object.getOwnPropertyDescriptor(
  Element.prototype,
  "animate"
);

describe("Catch the Answer Screen", () => {
  let screen: CatchTheAnswer;
  let controller: ReturnType<typeof makeController>;
  let game: ReturnType<typeof makeGame>;

  beforeEach(() => {
    vi.useFakeTimers();

    audioInstances = [];

    vi.stubGlobal("Audio", FakeAudio);

    // Prevent the animation loop from running automatically.
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1)
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    // jsdom does not support visual animations.
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: vi.fn(() => ({ cancel: vi.fn() })),
    });

    document.body.innerHTML = '<main id="game"></main>';

    game = makeGame();
    controller = makeController();
    const model = makeModel();

    screen = new CatchTheAnswer(
      game as unknown as Game,
      controller as unknown as LaneGameController,
      model as unknown as LaneGameModel
    );

    screen.enter({});
  });

  afterEach(() => {
    screen.exit();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();

    if (originalAnimate) {
      Object.defineProperty(
        Element.prototype,
        "animate",
        originalAnimate
      );
    } else {
      Reflect.deleteProperty(Element.prototype, "animate");
    }

    document.body.innerHTML = "";
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

  const getButton = (label: string): HTMLButtonElement => {
    const button = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        "#catch-the-answer button"
      )
    ).find((button) => button.textContent?.includes(label));

    if (!button) {
      throw new Error(`Button not found: ${label}`);
    }

    return button;
  };

  // Simulate reaching the answer box in each of 10 rounds.
  const finishAllRounds = (): void => {
    const internals = screen as unknown as {
      checkAnswer: () => void;
    };

    for (let i = 0; i < 10; i++) {
      internals.checkAnswer();
      vi.advanceTimersByTime(650);
    }
  };

  it("starts background music when the game opens", () => {
    const music = getAudio("/sounds/lane-music.mp3");

    expect(music.play).toHaveBeenCalledTimes(1);
    expect(music.loop).toBe(true);
    expect(music.volume).toBe(0.15);

    expect(
      document.getElementById("catch-the-answer")
    ).not.toBeNull();
  });

  it("plays the correct sound for a correct answer", () => {
    screen.showFeedback(true);

    const sound = getAudio("/sounds/Correct.mp3");

    expect(sound.play).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain(
      "CORRECT! +10"
    );
  });

  it("plays the incorrect sound for a wrong answer", () => {
    screen.showFeedback(false);

    const sound = getAudio("/sounds/Incorrect.mp3");

    expect(sound.play).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain("WRONG!");
  });

  it("stops music and removes the screen when exiting", () => {
    const music = getAudio("/sounds/lane-music.mp3");

    music.pause.mockClear();

    screen.exit();

    expect(music.pause).toHaveBeenCalledTimes(1);
    expect(music.currentTime).toBe(0);

    expect(
      document.getElementById("catch-the-answer")
    ).toBeNull();
  });

  it("shows results and stops music after 10 rounds", () => {
    const music = getAudio("/sounds/lane-music.mp3");

    music.pause.mockClear();

    finishAllRounds();

    expect(document.body.textContent).toContain(
      "RACE COMPLETE!"
    );
    expect(document.body.textContent).toContain(
      "SCORE: 30"
    );
    expect(document.body.textContent).toContain(
      "CORRECT: 3/10"
    );
    expect(document.body.textContent).toContain(
      "REVIEW WRONG ANSWERS"
    );

    expect(music.pause).toHaveBeenCalledTimes(1);
    expect(controller.handleLaneSelection).toHaveBeenCalledTimes(10);
    expect(game.state.addCoins).toHaveBeenCalledTimes(1);
  });

  it("sends missed answers to Wrong Answers Review", () => {
    finishAllRounds();

    getButton("REVIEW WRONG ANSWERS").click();

    expect(controller.getWrongAnswers).toHaveBeenCalledTimes(1);

    expect(game.goTo).toHaveBeenCalledWith(
      SceneIds.WrongAnswers,
      {
        wrongAnswers: missedAnswers,
        returnTo: SceneIds.MiniGameSelect,
      }
    );
  });

  it("restarts the game when PLAY AGAIN is clicked", () => {
    finishAllRounds();

    getButton("PLAY AGAIN").click();

    const music = getAudio("/sounds/lane-music.mp3");

    expect(controller.startGame).toHaveBeenCalledTimes(2);
    expect(music.play).toHaveBeenCalledTimes(2);

    expect(document.body.textContent).not.toContain(
      "RACE COMPLETE!"
    );

    expect(
      document.querySelectorAll("#catch-the-answer")
    ).toHaveLength(1);
  });

  it("returns to the previous screen when Exit is clicked", () => {
    const exitButton = document.querySelector<HTMLButtonElement>(
      '[aria-label="Exit mini-game"]'
    );

    expect(exitButton).not.toBeNull();

    exitButton!.click();

    expect(game.back).toHaveBeenCalledTimes(1);
  });
});
