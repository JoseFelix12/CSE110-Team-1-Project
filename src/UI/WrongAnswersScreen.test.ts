/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Game } from "../Game/Game.ts";
import { GameState } from "../Game/GameState.ts";
import { SceneIds } from "../Game/Scene.ts";
import { AdditionQuestion, SubtractionQuestion, DivisionQuestion } from "../Question/QuestionModel.ts";
import { WrongAnswersScreen } from "./WrongAnswersScreen.ts";

describe("Wrong Answers Review Screen", () => {
  let game: Game;

  beforeEach(() => {
    document.body.innerHTML = '<main id="game"></main>';

    game = new Game(new GameState(null));

    game.register(
      SceneIds.WrongAnswers,
      (g) => new WrongAnswersScreen(g)
    );

    game.register(SceneIds.Stats, () => ({
      enter: () => {},
    }));

    game.register(SceneIds.MiniGameSelect, () => ({
      enter: () => {},
    }));
  });

  afterEach(() => {
    game.stop();
    document.body.innerHTML = "";
  });

  const getButton = (label: string): HTMLButtonElement => {
    const button = Array.from(
      document.querySelectorAll<HTMLButtonElement>("#game button")
    ).find((button) => button.textContent?.includes(label));

    if (!button) {
      throw new Error(`Button not found: ${label}`);
    }

    return button;
  };

  it("displays the missed question and answers", () => {
    const question = new AdditionQuestion(8, 5);

    game.goTo(SceneIds.WrongAnswers, {
      wrongAnswers: [
        { question, playerAnswer: "12" },
      ],
    });

    const text = document.getElementById("game")!.textContent!;

    expect(text).toContain("WRONG ANSWERS REVIEW");
    expect(text).toContain("QUESTION 1 OF 1");
    expect(text).toContain(question.text);
    expect(text).toContain("12");
    expect(text).toContain("13");
    expect(text).toContain("Start at 8 and count forward 5 times: 9, 10, 11, 12, 13.");
  });

  it("navigates between missed questions", () => {
    const first = new AdditionQuestion(8, 5);
    const second = new SubtractionQuestion(9, 2);

    game.goTo(SceneIds.WrongAnswers, {
      wrongAnswers: [
        { question: first, playerAnswer: "12" },
        { question: second, playerAnswer: "8" },
      ],
    });

    expect(document.body.textContent).toContain("QUESTION 1 OF 2");
    expect(getButton("PREV").disabled).toBe(true);

    getButton("NEXT").click();

    expect(document.body.textContent).toContain("QUESTION 2 OF 2");
    expect(document.body.textContent).toContain(second.text);
    expect(getButton("NEXT").disabled).toBe(true);

    getButton("PREV").click();

    expect(document.body.textContent).toContain("QUESTION 1 OF 2");
    expect(document.body.textContent).toContain(first.text);
  });

  it("shows TIME OUT when no answer was submitted", () => {
    const question = new AdditionQuestion(4, 3);

    game.goTo(SceneIds.WrongAnswers, {
      wrongAnswers: [
        { question, playerAnswer: null },
      ],
    });

    expect(document.body.textContent).toContain("TIME OUT");
    expect(document.body.textContent).toContain("Start at 4 and count forward 3 times: 5, 6, 7.");  });

  it("displays the correct lane expression when provided", () => {
    const question = new DivisionQuestion(12, 3);

    game.goTo(SceneIds.WrongAnswers, {
      wrongAnswers: [
        {
          question,
          playerAnswer: "8 - 2",
          correctChoice: "6 - 2",
        },
      ],
    });

    expect(document.body.textContent).toContain("8 - 2");
    expect(document.body.textContent).toContain("6 - 2");
    expect(document.body.textContent).toContain(
      "12 divided by 3 = 4"
    );
  });

  it("handles a perfect race with no wrong answers", () => {
    game.goTo(SceneIds.WrongAnswers, {
      wrongAnswers: [],
    });

    expect(document.body.textContent).toContain("PERFECT RACE!");
    expect(document.body.textContent).toContain("0 MISSED QUESTIONS");

    expect(getButton("PREV").style.display).toBe("none");
    expect(getButton("NEXT").style.display).toBe("none");
  });

  it("returns to Stats after reviewing race questions", () => {
    game.goTo(SceneIds.WrongAnswers, {
      wrongAnswers: [],
      returnTo: SceneIds.Stats,
    });

    getButton("BACK TO STATS").click();

    expect(game.getCurrentSceneId()).toBe(SceneIds.Stats);
  });

  it("returns to Mini Games after reviewing mini-game questions", () => {
    game.goTo(SceneIds.WrongAnswers, {
      wrongAnswers: [],
      returnTo: SceneIds.MiniGameSelect,
    });

    getButton("BACK TO MINI GAMES").click();

    expect(game.getCurrentSceneId()).toBe(SceneIds.MiniGameSelect);
  });
});
