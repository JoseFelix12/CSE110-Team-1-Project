
import type { Game } from "../Game/Game.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";
// Update these two import paths if your teammates use a different folder.
import { QuestionController } from "../Question/QuestionController.ts";
import type { Question } from "../Question/QuestionModel.ts";
import { COINS_PER_CORRECT_ANSWER } from "../Game/gameConfig.ts";

type MathQuestion = {
  text: string;
  choices: [number, number, number];
  correct: number;
  source: Question;
};

export class CatchTheAnswer implements Scene {
  private game: Game;
  private questionController = new QuestionController();
  private readonly totalRounds = 10;
  private correctCount = 0;
  private currentQuestion: MathQuestion | null = null;
  private availableLevelCount = 1;

  private screen: HTMLElement | null = null;
  private car: HTMLImageElement | null = null;
  private questionText: HTMLDivElement | null = null;
  private scoreText: HTMLDivElement | null = null;
  private roadLines: HTMLDivElement | null = null;
  private movingDashes: HTMLDivElement[] = [];

  private answers: HTMLDivElement[] = [];

  // Keep the lane positions that worked!
  private readonly lanePositions = [25, 50, 75];
  private readonly font = '"Press Start 2P", monospace';

  private lane = 1;
  private score = 0;
  private round = 0;
  private answerY = -18;
  private roadOffset = 0;

  private active = false;
  private paused = false;
  private lastTime = 0;
  private frameId = 0;
  private pauseTimer: number | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  enter(_params: SceneParams): void {
    this.cleanup();

    // Load pixel font without editing the team's index.html.
    if (!document.getElementById("catch-arcade-font")) {
      const link = document.createElement("link");
      link.id = "catch-arcade-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
      document.head.appendChild(link);
    }

    this.lane = 1;
    this.score = 0;
    this.correctCount = 0;
    this.round = 0;
    this.questionController = new QuestionController();
    this.availableLevelCount = Math.max(1, this.game.state.getLevels().filter(level => level.unlocked).length);
    this.answerY = -18;
    this.roadOffset = 0;
    this.lastTime = 0;
    this.active = true;
    this.paused = false;

    const screen = document.createElement("section");
    screen.id = "catch-the-answer";

    Object.assign(screen.style, {
      position: "relative",
      width: "100%",
      maxWidth: "1400px",
      aspectRatio: "16 / 10",
      margin: "0 auto",
      overflow: "hidden",
      backgroundColor: "#252525",
      fontFamily: this.font,
    });

    this.screen = screen;

    // Road and grass background
    const road = document.createElement("img");
    road.src = "/images/cleanroad.png";

    Object.assign(road.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      objectFit: "fill",
      pointerEvents: "none",
      zIndex: "0",
    });

    screen.appendChild(road);

    // Two moving dashed dividers between lanes 25%, 50%, 75%.
    // Individual dashes keep a constant height while they move.
    const roadLines = document.createElement("div");
    Object.assign(roadLines.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
      zIndex: "1",
      overflow: "hidden",
    });

    const dashCount = 6;
    for (const position of [37.5, 62.5]) {
      for (let i = 0; i < dashCount; i++) {
        const dash = document.createElement("div");
        Object.assign(dash.style, {
          position: "absolute",
          left: `${position}%`,
          top: "0",
          width: "1.5%",
          height: "10%",
          backgroundColor: "#d9d9d9",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        });
        // Each dash has a fixed vertical position within a 120% cycle.
        dash.dataset.index = String(i);
        roadLines.appendChild(dash);
        this.movingDashes.push(dash);
      }
    }

    screen.appendChild(roadLines);
    this.roadLines = roadLines;

    // Question display
    const question = document.createElement("div");

    Object.assign(question.style, {
      position: "absolute",
      top: "5%",
      left: "50%",
      transform: "translateX(-50%)",
      width: "38%",
      height: "12%",
      backgroundImage: 'url("/images/Rectangle 90.png")',
      backgroundSize: "100% 100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px",
      boxSizing: "border-box",
      textAlign: "center",
      fontFamily: this.font,
      fontSize: "clamp(10px, 1.8vw, 22px)",
      lineHeight: "1.6",
      color: "#111",
      zIndex: "5",
    });

    screen.appendChild(question);
    this.questionText = question;

    // Score panel
    const score = document.createElement("div");

    Object.assign(score.style, {
      position: "absolute",
      top: "5%",
      right: "3%",
      width: "16%",
      height: "12%",
      backgroundImage: 'url("/images/Group 7.png")',
      backgroundSize: "100% 100%",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      paddingBottom: "1.5%",
      boxSizing: "border-box",
      color: "#fff",
      fontFamily: this.font,
      fontSize: "clamp(9px, 1.4vw, 17px)",
      zIndex: "5",
    });

    screen.appendChild(score);
    this.scoreText = score;

    // Exit button
    const exitButton = document.createElement("button");

    Object.assign(exitButton.style, {
      position: "absolute",
      top: "5%",
      left: "3%",
      width: "16%",
      height: "12%",
      backgroundImage: 'url("/images/Group 6.png")',
      backgroundSize: "100% 100%",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      zIndex: "6",
    });

    exitButton.setAttribute("aria-label", "Exit mini-game");
    exitButton.onclick = () => this.game.back();
    screen.appendChild(exitButton);

    // Three falling answer boxes
    for (let i = 0; i < 3; i++) {
      const box = document.createElement("div");

      Object.assign(box.style, {
        position: "absolute",
        left: `${this.lanePositions[i]}%`,
        top: "-18%",
        transform: "translateX(-50%)",
        width: "11%",
        aspectRatio: "1 / 1",
        backgroundImage: 'url("/images/Rectangle.png")',
        backgroundSize: "100% 100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: this.font,
        fontSize: "clamp(12px, 1.8vw, 23px)",
        color: "#111",
        zIndex: "3",
      });

      screen.appendChild(box);
      this.answers.push(box);
    }

    // Player car
    const car = document.createElement("img");
    car.src = "/images/redcar.png";

    Object.assign(car.style, {
      position: "absolute",
      width: "12%",
      height: "auto",
      bottom: "5%",
      left: "50%",
      transform: "translateX(-50%)",
      transition: "left 0.12s ease",
      imageRendering: "pixelated",
      zIndex: "4",
    });

    screen.appendChild(car);
    this.car = car;

    document.getElementById("game")!.appendChild(screen);

    this.updateCarPosition();
    this.updateScore();
    this.startRound();

    document.addEventListener("keydown", this.handleKeyDown);
    this.frameId = requestAnimationFrame(this.animate);
  }

  // The unlocked-level rules below follow our planned level progression.
  // Confirm the exact difficulty rules with the team's gameConfig.ts.
  private generateUnlockedQuestion(): MathQuestion {
    const unlocked = this.availableLevelCount;
    let type: string;
    let maxOperand: number;

    if (unlocked === 1) {
      type = "multiplication";
      maxOperand = 5;
    } else if (unlocked === 2) {
      type = "multiplication";
      maxOperand = 10;
    } else {
      // Division becomes available at level 3.
      // At level 4, the current generator still caps operands at 10.
      type = Math.random() < 0.5 ? "multiplication" : "division";
      maxOperand = 10;
    }

    let question: Question;
    // Reuse the teammate's generator, rejecting questions that exceed
    // the currently available difficulty. The limit is always reachable.
    do {
      question = this.questionController.generateQuestion(type);
    } while (
      (type === "multiplication" && (question.a > maxOperand || question.b > maxOperand)) ||
      (type === "division" && (question.b > maxOperand || question.answer > maxOperand))
    );

    const correct = question.answer;
    const choices = new Set<number>([correct]);
    while (choices.size < 3) {
      const offset = Math.floor(Math.random() * 11) - 5;
      const wrong = correct + offset;
      if (offset !== 0 && wrong >= 0) choices.add(wrong);
    }

    const shuffled = [...choices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
      text: question.text,
      correct,
      choices: shuffled as [number, number, number],
      source: question,
    };
  }

  private startRound(): void {
    if (this.round >= this.totalRounds) {
      this.finishGame();
      return;
    }

    this.currentQuestion = this.generateUnlockedQuestion();
    this.answerY = -18;

    if (this.questionText) {
      this.questionText.textContent = this.currentQuestion.text;
    }

    this.answers.forEach((box, i) => {
      box.textContent = String(this.currentQuestion!.choices[i]);
      box.style.top = `${this.answerY}%`;
    });

    this.paused = false;
  }

  private animate = (time: number): void => {
    if (!this.active) return;

    if (this.lastTime === 0) this.lastTime = time;

    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    // Move individual dashes downward at constant speed.
    // The 120% loop includes space above and below the screen,
    // so each dash disappears before re-entering at the top.
    this.roadOffset = (this.roadOffset + dt * 22) % 120;
    this.movingDashes.forEach((dash) => {
      const index = Number(dash.dataset.index);
      const y = ((index * 20 + this.roadOffset) % 120) - 15;
      dash.style.top = `${y}%`;
    });

    if (!this.paused) {
      this.answerY += dt * 20;

      this.answers.forEach((box) => {
        box.style.top = `${this.answerY}%`;
      });

      if (this.answerY >= 76) {
        this.checkAnswer();
      }
    }

    if (this.active) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  };

  private checkAnswer(): void {
    this.paused = true;

    if (!this.currentQuestion) return;
    const selectedAnswer = this.currentQuestion.choices[this.lane];
    const correct = this.questionController.submitAnswer(String(selectedAnswer));

    if (correct) {
      this.score += 10;
      this.correctCount++;
    }

    this.updateScore();
    this.showFeedback(correct);

    this.pauseTimer = window.setTimeout(() => {
      this.pauseTimer = null;

      if (!this.active) return;

      this.round++;
      this.startRound();
    }, 650);
  }

  private showFeedback(correct: boolean): void {
    if (!this.screen || !this.car) return;

    const feedback = document.createElement("div");
    feedback.textContent = correct ? "CORRECT! +10" : "WRONG!";

    Object.assign(feedback.style, {
      position: "absolute",
      left: "50%",
      top: "45%",
      transform: "translate(-50%, -50%)",
      fontFamily: this.font,
      fontSize: "clamp(14px, 2.3vw, 28px)",
      color: correct ? "#59FF72" : "#FF4B4B",
      textShadow: "3px 3px #000",
      textAlign: "center",
      whiteSpace: "nowrap",
      zIndex: "10",
      pointerEvents: "none",
    });

    this.screen.appendChild(feedback);

    const flash = document.createElement("div");

    Object.assign(flash.style, {
      position: "absolute",
      inset: "0",
      backgroundColor: correct
        ? "rgba(0, 255, 70, 0.18)"
        : "rgba(255, 0, 0, 0.22)",
      zIndex: "8",
      pointerEvents: "none",
    });

    this.screen.appendChild(flash);

    feedback.animate(
      [
        { opacity: 0, transform: "translate(-50%, 0%) scale(0.7)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1.1)" },
        { opacity: 0, transform: "translate(-50%, -100%) scale(1)" },
      ],
      { duration: 600, easing: "ease-out" }
    );

    flash.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 450 }
    );

    if (correct) {
      this.car.animate(
        [
          { transform: "translateX(-50%) translateY(0)" },
          { transform: "translateX(-50%) translateY(-12px)" },
          { transform: "translateX(-50%) translateY(0)" },
        ],
        { duration: 400 }
      );
    } else {
      this.car.animate(
        [
          { transform: "translateX(-50%)" },
          { transform: "translateX(calc(-50% - 8px))" },
          { transform: "translateX(calc(-50% + 8px))" },
          { transform: "translateX(-50%)" },
        ],
        { duration: 350, iterations: 2 }
      );
    }

    window.setTimeout(() => {
      feedback.remove();
      flash.remove();
    }, 650);
  }

  private updateScore(): void {
    if (this.scoreText) {
      this.scoreText.textContent = String(this.score);
    }
  }

  private updateCarPosition(): void {
    if (!this.car) return;

    this.car.style.left =
      `${this.lanePositions[this.lane]}%`;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.active || this.paused) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.lane = Math.max(0, this.lane - 1);
      this.updateCarPosition();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.lane = Math.min(2, this.lane + 1);
      this.updateCarPosition();
    }
  };

  private finishGame(): void {
    if (!this.active) return;
    this.active = false;
    this.paused = true;
    cancelAnimationFrame(this.frameId);

    const coinsEarned = this.correctCount * COINS_PER_CORRECT_ANSWER;
    this.game.state.addCoins(coinsEarned);

    this.answers.forEach((box) => {
      box.style.display = "none";
    });

    if (this.questionText) {
      this.questionText.textContent = "";
    }

    if (!this.screen) return;

    const overlay = document.createElement("div");

    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      backgroundColor: "rgba(0, 0, 0, 0.78)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "28px",
      padding: "20px",
      boxSizing: "border-box",
      zIndex: "20",
      fontFamily: this.font,
      color: "#fff",
      textAlign: "center",
    });

    const title = document.createElement("div");
    title.textContent = "RACE COMPLETE!";

    Object.assign(title.style, {
      fontSize: "clamp(14px, 3vw, 30px)",
      color: "#FFD700",
      lineHeight: "1.7",
    });

    const finalScore = document.createElement("div");
    finalScore.textContent = `SCORE: ${this.score}`;

    Object.assign(finalScore.style, {
      fontSize: "clamp(12px, 2vw, 20px)",
      lineHeight: "1.7",
    });

    const restart = document.createElement("button");
    restart.textContent = "PLAY AGAIN";

    Object.assign(restart.style, {
      padding: "18px 24px",
      backgroundColor: "#E52521",
      border: "4px solid white",
      borderRadius: "8px",
      color: "white",
      fontFamily: this.font,
      fontSize: "clamp(9px, 1.5vw, 14px)",
      cursor: "pointer",
    });

    restart.onclick = () => {
      this.exit();
      this.enter({} as SceneParams);
    };

    overlay.appendChild(title);
    overlay.appendChild(finalScore);

    const details = document.createElement("div");
    details.textContent = `CORRECT: ${this.correctCount}/${this.totalRounds} | +${coinsEarned} COINS`;
    details.style.fontSize = "clamp(9px, 1.4vw, 15px)";
    details.style.lineHeight = "1.8";
    overlay.appendChild(details);

    const balance = document.createElement("div");
    balance.textContent = `TOTAL COINS: ${this.game.state.getCoins()}`;
    balance.style.fontSize = "clamp(9px, 1.4vw, 15px)";
    overlay.appendChild(balance);
    overlay.appendChild(restart);

    const back = document.createElement("button");
    back.textContent = "BACK TO MINI GAMES";
    Object.assign(back.style, {
      padding: "12px 18px", backgroundColor: "#333", color: "white",
      border: "3px solid white", borderRadius: "8px",
      fontFamily: this.font, fontSize: "clamp(8px, 1.2vw, 12px)",
      cursor: "pointer",
    });
    back.onclick = () => this.game.back();
    overlay.appendChild(back);

    this.screen.appendChild(overlay);
  }

  private cleanup(): void {
    this.active = false;
    cancelAnimationFrame(this.frameId);

    if (this.pauseTimer !== null) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    document.removeEventListener("keydown", this.handleKeyDown);

    this.screen?.remove();
    this.screen = null;
    this.car = null;
    this.questionText = null;
    this.scoreText = null;
    this.roadLines = null;
    this.movingDashes = [];
    this.answers = [];
    this.currentQuestion = null;
  }

  exit(): void {
    this.cleanup();
  }
}
