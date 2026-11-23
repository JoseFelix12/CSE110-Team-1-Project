import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";
import type { Question } from "../Question/QuestionModel.ts";

type WrongAnswer = {
  question: Question;
  playerAnswer: string | null;
  correctChoice?: string;
};

export class WrongAnswersScreen implements Scene {
  private game: Game;
  private screen: HTMLElement | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  private explain(question: Question): string {
    const { a, b, operator, answer } = question;

    switch (operator) {
      case "addition":
        return `${a} + ${b} = ${answer}`;
      case "subtraction":
        return `${a} - ${b} = ${answer}`;
      case "multiplication":
        return `${a} groups of ${b} = ${answer}`;
      case "division":
        return `${a} divided by ${b} = ${answer}`;
    }
  }

  enter(params: SceneParams): void {
    this.exit();

    const wrongAnswers = Array.isArray(params.wrongAnswers)
      ? (params.wrongAnswers as WrongAnswer[])
      : [];

    let index = 0;

    const screen = document.createElement("section");
    Object.assign(screen.style, {
      position: "relative",
      width: "100%",
      maxWidth: "1400px",
      aspectRatio: "16 / 10",
      margin: "0 auto",
      overflow: "hidden",
      backgroundImage: 'url("/images/Wronganswers.png")',
      backgroundSize: "100% 100%",
      backgroundRepeat: "no-repeat",
      fontFamily: '"Press Start 2P", monospace',
      boxSizing: "border-box",
    });

    const panel = document.createElement("div");
    Object.assign(panel.style, {
      position: "absolute",
      left: "16%",
      top: "7%",
      width: "68%",
      height: "86%",
      background: "#24242c",
      border: "3px solid white",
      borderRadius: "14px",
      boxSizing: "border-box",
      padding: "clamp(10px, 1.4vw, 18px)",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      color: "white",
      overflowY: "auto",
    });

    const heading = document.createElement("div");
    heading.textContent = "WRONG ANSWERS REVIEW";
    Object.assign(heading.style, {
      color: "#ffd32a",
      textAlign: "center",
      fontSize: "clamp(10px, 1.6vw, 20px)",
      lineHeight: "1.5",
    });

    const counter = document.createElement("div");
    Object.assign(counter.style, {
      textAlign: "center",
      color: "#bbbbbb",
      fontSize: "clamp(8px, 1vw, 13px)",
    });

    const questionBox = document.createElement("div");
    Object.assign(questionBox.style, {
        background: "#373740",
        border: "2px solid #777",
        borderRadius: "8px",
        padding: "16px 20px",
        textAlign: "center",
        fontSize: "clamp(16px, 1.6vw, 22px)",
        lineHeight: "1.6",
        overflowWrap: "anywhere",
        maxHeight: "38%",
        overflowY: "auto",
        flexShrink: "1",
        minHeight: "0",
        });

    const answers = document.createElement("div");
    Object.assign(answers.style, {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
    });

    const makeAnswerBox = (
      label: string,
      background: string,
      color: string
    ) => {
      const box = document.createElement("div");
      Object.assign(box.style, {
        background,
        border: `2px solid ${color}`,
        borderRadius: "8px",
        padding: "16px 8px",
        textAlign: "center",
        minWidth: "0",
      });

      const title = document.createElement("div");
      title.textContent = label;
      Object.assign(title.style, {
        color,
        fontSize: "clamp(7px, 0.9vw, 12px)",
        lineHeight: "1.7",
      });

      const value = document.createElement("div");
      Object.assign(value.style, {
        color: "white",
        fontSize: "clamp(12px, 2vw, 25px)",
        marginTop: "12px",
        lineHeight: "1.5",
        overflowWrap: "anywhere",
      });

      box.append(title, value);
      return { box, value };
    };

    const wrong = makeAnswerBox(
      "YOUR ANSWER",
      "#512a32",
      "#ff8888"
    );

    const correct = makeAnswerBox(
      "CORRECT ANSWER",
      "#244936",
      "#89e5a7"
    );

    answers.append(wrong.box, correct.box);

    const explanation = document.createElement("div");
    Object.assign(explanation.style, {
      background: "#373740",
      border: "2px solid #777",
      borderRadius: "8px",
      padding: "14px",
    fontSize: "clamp(10px, 1.15vw, 16px)",
    lineHeight: "1.7",
      overflowWrap: "anywhere",
    });

    const navigation = document.createElement("div");
    Object.assign(navigation.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px",
      marginTop: "auto",
      flexWrap: "wrap",
    });

    const makeButton = (label: string, onClick: () => void) => {
      const button = document.createElement("button");
      button.textContent = label;

      Object.assign(button.style, {
        background: "#111111",
        border: "2px solid white",
        borderRadius: "7px",
        color: "white",
        padding: "12px",
        fontFamily: "inherit",
        fontSize: "clamp(7px, 0.8vw, 11px)",
        cursor: "pointer",
        lineHeight: "1.5",
      });

      button.onclick = onClick;
      return button;
    };

    const previous = makeButton("◀ PREV", () => {
      if (index > 0) {
        index--;
        update();
      }
    });

    const backToMiniGames =
        params.returnTo === SceneIds.MiniGameSelect;

    const back = makeButton(
        backToMiniGames ? "BACK TO MINI GAMES" : "BACK TO STATS",
        () => {
            this.game.goTo(
            backToMiniGames ? SceneIds.MiniGameSelect : SceneIds.Stats,
            params
            );
        }
        );

    const next = makeButton("NEXT ▶", () => {
      if (index < wrongAnswers.length - 1) {
        index++;
        update();
      }
    });

    navigation.append(previous, back, next);

    const update = () => {
      if (wrongAnswers.length === 0) {
        counter.textContent = "0 MISSED QUESTIONS";
        questionBox.textContent = "PERFECT RACE!";
        wrong.box.style.display = "none";
        correct.box.style.display = "none";
        explanation.textContent =
          "You answered every question correctly!";
        previous.style.display = "none";
        next.style.display = "none";
        return;
      }

      const entry = wrongAnswers[index];

      counter.textContent =
        `QUESTION ${index + 1} OF ${wrongAnswers.length}`;

      questionBox.textContent = entry.question.text;

      wrong.value.textContent =
        entry.playerAnswer ?? "TIME OUT";

    correct.value.textContent =
        entry.correctChoice ?? String(entry.question.answer);

      explanation.textContent =
        `💡 EXPLANATION: ${this.explain(entry.question)}`;

      previous.disabled = index === 0;
      next.disabled = index === wrongAnswers.length - 1;

      previous.style.opacity = previous.disabled ? "0.4" : "1";
      next.style.opacity = next.disabled ? "0.4" : "1";
    };

    panel.append(
      heading,
      counter,
      questionBox,
      answers,
      explanation,
      navigation
    );

    screen.appendChild(panel);
    document.getElementById("game")!.appendChild(screen);

    this.screen = screen;
    update();
  }

  exit(): void {
    this.screen?.remove();
    this.screen = null;
  }
}
