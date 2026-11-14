
import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";
import { RepairMinigame } from "../Game/RepairMinigame.ts";
import { COINS_PER_CORRECT_ANSWER } from "../Game/gameConfig.ts";

const TOTAL_QUESTIONS = 10;
const HEALTH_GAIN = 20;
const HEALTH_LOSS = 10;
const ANSWER_DELAY = 500;
const FONT = '"Press Start 2P", monospace';

export class RepairSolverScreen implements Scene {
  private screen: HTMLElement | null = null;
  private timeoutId: number | null = null;

  constructor(private game: Game) {}

  enter(_params: SceneParams): void {
    // Same pixel font used by Mini Game 1
    if (!document.getElementById("catch-arcade-font")) {
      const link = document.createElement("link");
      link.id = "catch-arcade-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
      document.head.appendChild(link);
    }

    const screen = document.createElement("section");
    this.screen = screen;

    screen.id = "repair-solver-screen";
    screen.className = "screen";

    Object.assign(screen.style, {
      position: "relative",
      width: "100%",
      maxWidth: "1440px",
      aspectRatio: "1440 / 1024",
      margin: "0 auto",
      overflow: "hidden",
      backgroundColor: "#252525",
      fontFamily: FONT,
    });

    const addImage = (
      src: string,
      left: string,
      top: string,
      width: string,
      height: string
    ): HTMLImageElement => {
      const img = document.createElement("img");
      img.src = src;

      Object.assign(img.style, {
        position: "absolute",
        left,
        top,
        width,
        height,
        objectFit: "fill",
        pointerEvents: "none",
      });

      screen.appendChild(img);
      return img;
    };

    // Background
    addImage(
      "/images/MINI%20GAME%202.png",
      "0%", "0%", "100%", "100%"
    );

    // Red car
    const carImage = addImage(
      "/images/redcarmn2.png",
      "5%", "30%", "38%", "45%"
    );
    carImage.style.objectFit = "contain";
    carImage.style.imageRendering = "pixelated";

    // EXIT artwork
    const exitButton = document.createElement("button");
    exitButton.setAttribute("aria-label", "Exit Repair Solver");

    Object.assign(exitButton.style, {
      position: "absolute",
      left: "3%",
      top: "3%",
      width: "13%",
      height: "7%",
      padding: "0",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      zIndex: "25",
    });

    const exitImage = document.createElement("img");
    exitImage.src = "/images/Group%206.png";
    exitImage.alt = "EXIT";

    Object.assign(exitImage.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      pointerEvents: "none",
    });

    exitButton.appendChild(exitImage);
    exitButton.onclick = () => {
      this.game.goTo(SceneIds.MiniGameSelect);
    };
    screen.appendChild(exitButton);

    // Existing repair logic, using the player's car
    const repairGame = new RepairMinigame(
      this.game.state.getMutableCar()
    );

    let questionNumber = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let finished = false;

    // Question box
    const questionBox = document.createElement("div");

    Object.assign(questionBox.style, {
      position: "absolute",
      left: "48%",
      top: "18%",
      width: "46%",
      height: "25%",
      backgroundImage: 'url("/images/Rectangle%2091.png")',
      backgroundSize: "100% 100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3%",
      boxSizing: "border-box",
      textAlign: "center",
      color: "#252525",
      fontFamily: FONT,
      fontSize: "clamp(9px, 1.15vw, 16px)",
      lineHeight: "1.8",
      fontWeight: "normal",
    });

    screen.appendChild(questionBox);

    // Progress and car health
    const status = document.createElement("div");

    Object.assign(status.style, {
      position: "absolute",
      left: "3%",
      top: "80%",
      width: "42%",
      textAlign: "center",
      color: "white",
      fontFamily: FONT,
      fontSize: "clamp(8px, 1vw, 14px)",
      lineHeight: "2",
      whiteSpace: "pre-line",
    });

    screen.appendChild(status);

    // Answer rectangles
    const buttons: HTMLButtonElement[] = [];

    for (let i = 0; i < 4; i++) {
      const button = document.createElement("button");

      Object.assign(button.style, {
        position: "absolute",
        left: `${48 + (i % 2) * 24}%`,
        top: `${49 + Math.floor(i / 2) * 17}%`,
        width: "22%",
        height: "13%",
        backgroundImage: 'url("/images/Rectangle%2091.png")',
        backgroundSize: "100% 100%",
        backgroundColor: "transparent",
        border: "none",
        padding: "2%",
        boxSizing: "border-box",
        color: "#252525",
        fontFamily: FONT,
        fontSize: "clamp(12px, 1.5vw, 20px)",
        cursor: "pointer",
      });

      screen.appendChild(button);
      buttons.push(button);
    }

    const updateStatus = (message = ""): void => {
      status.textContent =
        `QUESTION ${questionNumber}/${TOTAL_QUESTIONS}\n` +
        `CAR HEALTH: ${repairGame.getCarStatus()}` +
        (message ? `\n${message}` : "");
    };

    const showResults = (): void => {
      if (finished || this.screen !== screen) return;
      finished = true;

      questionBox.remove();
      buttons.forEach(button => button.remove());
      status.remove();

      const accuracy = Math.round(
        (correctCount / TOTAL_QUESTIONS) * 100
      );

      // Same coin reward rule as Mini Game 1
      const coinsEarned =
        correctCount * COINS_PER_CORRECT_ANSWER;

      // Award coins only once
      this.game.state.addCoins(coinsEarned);

      let title: string;
      let message: string;

      if (accuracy === 100) {
        title = "PERFECT REPAIR!";
        message = "AMAZING! PERFECT SCORE!";
      } else if (accuracy >= 80) {
        title = "REPAIR SUCCESSFUL!";
        message = "GREAT JOB REPAIRING!";
      } else if (accuracy >= 60) {
        title = "GOOD EFFORT!";
        message = "YOUR CAR IS IMPROVING!";
      } else {
        title = "MORE REPAIRS NEEDED!";
        message = "KEEP PRACTICING!";
      }

      // Same arcade-style overlay as Mini Game 1
      const overlay = document.createElement("div");

      Object.assign(overlay.style, {
        position: "absolute",
        inset: "0",
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        padding: "20px",
        boxSizing: "border-box",
        zIndex: "20",
        fontFamily: FONT,
        color: "#fff",
        textAlign: "center",
        overflowY: "auto",
      });

      const heading = document.createElement("div");
      heading.textContent = title;

      Object.assign(heading.style, {
        fontSize: "clamp(14px, 2.5vw, 30px)",
        color: "#FFD700",
        lineHeight: "1.7",
      });

      const description = document.createElement("div");
      description.textContent = message;

      Object.assign(description.style, {
        fontSize: "clamp(9px, 1.2vw, 15px)",
        lineHeight: "1.8",
      });

      const stats = document.createElement("div");
      stats.textContent =
        `CORRECT: ${correctCount}/${TOTAL_QUESTIONS}\n` +
        `INCORRECT: ${incorrectCount}\n` +
        `ACCURACY: ${accuracy}%\n` +
        `CAR HEALTH: ${repairGame.getCarStatus()}`;

      Object.assign(stats.style, {
        whiteSpace: "pre-line",
        lineHeight: "2",
        fontSize: "clamp(9px, 1.4vw, 16px)",
      });

      const coins = document.createElement("div");
      coins.textContent = `+${coinsEarned} COINS`;

      Object.assign(coins.style, {
        color: "#FFD700",
        fontSize: "clamp(12px, 1.8vw, 20px)",
        lineHeight: "1.6",
      });

      const balance = document.createElement("div");
      balance.textContent =
        `TOTAL COINS: ${this.game.state.getCoins()}`;

      Object.assign(balance.style, {
        fontSize: "clamp(9px, 1.2vw, 14px)",
        lineHeight: "1.6",
      });

      // Red Play Again button
      const playAgain = document.createElement("button");
      playAgain.textContent = "PLAY AGAIN";

      Object.assign(playAgain.style, {
        padding: "18px 24px",
        backgroundColor: "#E52521",
        border: "4px solid white",
        borderRadius: "8px",
        color: "white",
        fontFamily: FONT,
        fontSize: "clamp(9px, 1.5vw, 14px)",
        cursor: "pointer",
      });

      playAgain.onclick = () => {
        this.exit();
        this.enter({});
      };

      // Back to Mini Games
      const backButton = document.createElement("button");
      backButton.textContent = "BACK TO MINI GAMES";

      Object.assign(backButton.style, {
        padding: "12px 18px",
        backgroundColor: "#333",
        color: "white",
        border: "3px solid white",
        borderRadius: "8px",
        fontFamily: FONT,
        fontSize: "clamp(8px, 1.2vw, 12px)",
        cursor: "pointer",
      });

      backButton.onclick = () => {
        this.game.goTo(SceneIds.MiniGameSelect);
      };

      overlay.append(
        heading,
        description,
        stats,
        coins,
        balance,
        playAgain,
        backButton
      );

      screen.appendChild(overlay);
    };

    const nextQuestion = (): void => {
      if (finished || this.screen !== screen) return;

      if (questionNumber >= TOTAL_QUESTIONS) {
        showResults();
        return;
      }

      questionNumber++;

      const question = repairGame.generateQuestion("");
      const correctAnswer = question.answer;

      questionBox.textContent = question.text;

      // Generate four unique answer choices
      const choices = new Set<number>([correctAnswer]);

      while (choices.size < 4) {
        const offset = Math.floor(Math.random() * 15) - 7;
        const choice = correctAnswer + offset;

        if (choice >= 0) {
          choices.add(choice);
        }
      }

      // Shuffle the choices
      const shuffled = [...choices];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] =
          [shuffled[j], shuffled[i]];
      }

      updateStatus();

      buttons.forEach((button, index) => {
        const answer = shuffled[index];

        button.textContent = String(answer);
        button.disabled = false;
        button.style.opacity = "1";

        button.onclick = () => {
          buttons.forEach(b => {
            b.disabled = true;
          });

          if (answer === correctAnswer) {
            correctCount++;
            repairGame.fixCar(HEALTH_GAIN);
            updateStatus("CORRECT! +20 HEALTH");

            status.style.color = "#59FF72";
          } else {
            incorrectCount++;

            this.game.state
              .getMutableCar()
              .inflictDamage(HEALTH_LOSS);

            updateStatus("WRONG! -10 HEALTH");
            status.style.color = "#FF4B4B";
          }

          this.timeoutId = window.setTimeout(() => {
            this.timeoutId = null;

            if (this.screen !== screen) return;

            status.style.color = "white";

            if (questionNumber >= TOTAL_QUESTIONS) {
              showResults();
            } else {
              nextQuestion();
            }
          }, ANSWER_DELAY);
        };
      });
    };

    document.getElementById("game")!.appendChild(screen);
    nextQuestion();
  }

  exit(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.screen?.remove();
    this.screen = null;
  }
}
