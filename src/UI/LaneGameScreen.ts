import type { Game } from "../Game/Game.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";
import { COINS_PER_CORRECT_ANSWER } from "../Game/gameConfig.ts";
import type {LaneGameController} from "../LaneGame/LaneGameController.ts"
import type {LaneGameModel} from "../LaneGame/LaneGameModel.ts"
import { SceneIds } from "../Game/Scene.ts";
import { PauseMenu } from "../RacingScreen/view/PauseMenu.ts";

export class CatchTheAnswer implements Scene {
  private game: Game;
  private readonly totalRounds = 10;
  private laneGameController: LaneGameController;
  private laneGameModel: LaneGameModel;
  private correctSound = new Audio("/sounds/Correct.mp3");
  private incorrectSound = new Audio("/sounds/Incorrect.mp3");
  private backgroundMusic = new Audio("/sounds/lane-music.mp3");
  
  

  private screen: HTMLElement | null = null;
  private car: HTMLImageElement | null = null;
  private answerText: HTMLDivElement | null = null;
  private scoreText: HTMLDivElement | null = null;
  private roadLines: HTMLDivElement | null = null;
  private movingDashes: HTMLDivElement[] = [];

  private questions: HTMLDivElement[] = [];

  // Keep the lane positions that worked!
  private readonly lanePositions = [25, 50, 75];
  private readonly font = '"Press Start 2P", monospace';

  //private lane = 1;
  private round = 0;
  private answerY = -18;
  private roadOffset = 0;

  private active = false;
  private paused = false;
  private menuPaused = false;
  private muted = false;
  private pauseMenu: PauseMenu | null = null;
  private roundDelayRemaining = 650;
  private roundDelayStartedAt = 0;
  private lastTime = 0;
  private frameId = 0;
  private pauseTimer: number | null = null;

  constructor(game: Game, laneGameController: LaneGameController, laneGameModel: LaneGameModel) {
    this.game = game;
    this.laneGameController = laneGameController;
    this.laneGameModel = laneGameModel;
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

    this.laneGameController.startGame();
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.15;
    void this.backgroundMusic.play().catch(() => {});

    this.round = 0;
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
    this.roadLines = document.createElement("div");
    Object.assign(this.roadLines.style, {
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
        this.roadLines.appendChild(dash);
        this.movingDashes.push(dash);
      }
    }

    screen.appendChild(this.roadLines);

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
    this.answerText = question;

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

    // Pause button
    const pauseButton = document.createElement("button");
    pauseButton.type = "button";
    pauseButton.setAttribute("aria-label", "Pause Repair Solver");
    pauseButton.innerHTML = `
      <span style="display:flex; gap:5px;" aria-hidden="true">
        <span style="width:7px; height:20px; background:white;"></span>
        <span style="width:7px; height:20px; background:white;"></span>
      </span>
      <span>PAUSE</span>
    `;

    Object.assign(pauseButton.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      position: "absolute",
      top: "5%",
      left: "3%",
      width: "16%",
      height: "12%",
      backgroundColor: "#111111",
      border: "3px solid white",
      borderRadius: "8px",
      color: "white",
      fontFamily: this.font,
      fontSize: "clamp(8px, 1.2vw, 16px)",
      cursor: "pointer",
      zIndex: "6",
    });

    pauseButton.setAttribute("aria-label", "Pause mini-game");
    pauseButton.onclick = () => this.openPauseMenu();

    screen.appendChild(pauseButton);

    // Reuse the main race pause menu
    this.pauseMenu = new PauseMenu({
      onResume: () => this.resumeGame(),
      onMuteToggle: () => this.toggleMute(),
      onQuit: () => this.game.back(),
    });

    this.pauseMenu.setMuted(this.muted);
    Object.assign(this.pauseMenu.element.style, {
      position: "absolute",
      inset: "0",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(3px)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "30",
      display: "none",
    });
    
    // Custom mini-game pause menu styling
    const pausePanel = this.pauseMenu.element.querySelector<HTMLElement>(
      ".race-pause__panel"
    )!;

    Object.assign(pausePanel.style, {
      background: "#24242c",
      border: "4px solid white",
      borderRadius: "14px",
      padding: "clamp(20px, 3vw, 40px)",
      width: "40%",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
      textAlign: "center",
      fontFamily: this.font,
      boxSizing: "border-box",
      boxShadow: "0 8px 0 #111",
    });

    const pauseTitle = pausePanel.querySelector("h2")!;

    Object.assign(pauseTitle.style, {
      color: "#ffd32a",
      fontSize: "clamp(16px, 2.5vw, 30px)",
      margin: "0 0 15px",
      lineHeight: "1.6",
    });

    pausePanel.querySelectorAll("button").forEach((button) => {
      Object.assign(button.style, {
        background: "#373740",
        border: "3px solid white",
        borderRadius: "8px",
        padding: "18px 10px",
        color: "white",
        fontFamily: this.font,
        fontSize: "clamp(9px, 1.3vw, 18px)",
        textTransform: "uppercase",
        cursor: "pointer",
        lineHeight: "1.6",
        width: "100%",
      });

      button.onmouseenter = () => {
        button.style.filter = "brightness(1.3)";
      };

      button.onmouseleave = () => {
        button.style.filter = "brightness(1)";
      };
    });

    const resumeButton = pausePanel.querySelector<HTMLButtonElement>(
      ".race-pause__resume"
    )!;

    resumeButton.style.background = "#244936";
    resumeButton.style.borderColor = "#89e5a7";

    const quitButton = pausePanel.querySelector<HTMLButtonElement>(
      ".race-pause__quit"
    )!;

    quitButton.style.background = "#b81820";


    screen.appendChild(this.pauseMenu.element);

    // Three falling answer boxes
    for (let i = 0; i < 3; i++) {
      const box = document.createElement("div");

      Object.assign(box.style, {
        position: "absolute",
        left: `${this.lanePositions[i]}%`,
        top: "-18%",
        transform: "translateX(-50%)",
        width: "22%",
        aspectRatio: "3 / 1",
        backgroundImage: 'url("/images/Rectangle.png")',
        backgroundSize: "100% 100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: this.font,
        fontSize: "clamp(12px, 1.3vw, 20px)",
        color: "#111",
        zIndex: "3",
      });

      screen.appendChild(box);
      this.questions.push(box);
    }

    // Player car
    const car = document.createElement("img");
    car.src = "/images/redcar.png";

    Object.assign(car.style, {
      position: "absolute",
      width: "25%",
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
  /* private generateUnlockedQuestion(): Question {
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
  }*/

      private openPauseMenu(): void {
      if (!this.active || this.menuPaused) return;

      this.menuPaused = true;

      // Preserve the remaining delay between rounds.
      if (this.pauseTimer !== null) {
        clearTimeout(this.pauseTimer);
        this.pauseTimer = null;

        this.roundDelayRemaining = Math.max(
          0,
          this.roundDelayRemaining -
            (Date.now() - this.roundDelayStartedAt)
        );
      }

      this.backgroundMusic.pause();
      this.correctSound.pause();
      this.incorrectSound.pause();

      if (this.pauseMenu) {
        this.pauseMenu.element.style.display = "flex";
        this.pauseMenu.show();
      }
    }

    private resumeGame(): void {
      if (!this.active || !this.menuPaused) return;

      this.menuPaused = false;
      this.lastTime = 0;

      if (this.pauseMenu) {
        this.pauseMenu.hide();
        this.pauseMenu.element.style.display = "none";
      }
      void this.backgroundMusic.play().catch(() => {});

      if (this.paused) {
        this.scheduleNextRound();
      }
    }

    private toggleMute(): void {
      this.muted = !this.muted;

      this.backgroundMusic.muted = this.muted;
      this.correctSound.muted = this.muted;
      this.incorrectSound.muted = this.muted;

      this.pauseMenu?.setMuted(this.muted);
    }

  private startRound(): void {
    if (this.round >= this.totalRounds) {
      this.finishGame();
      return;
    }

    console.log("Generating round");

    this.laneGameController.generateRound();

    console.log("Round generated successfully");

    this.answerY = -18;

    //Assigns the correct answer to the answer box
    if (this.answerText) {
      this.answerText.textContent = String(this.laneGameModel.getTargetAnswer());
    }

    
    this.questions.forEach((box, i) => {
      box.textContent = String(this.laneGameModel.getLanes()[i].getQuestion()?.text || "");
      box.style.top = `${this.answerY}%`;
    });

    this.paused = false;
  }

  private animate = (time: number): void => {
    if (!this.active) return;

    if (this.menuPaused) {
      this.lastTime = time;
      this.frameId = requestAnimationFrame(this.animate);
      return;
}

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

      this.questions.forEach((box) => {
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
    if (!this.active || this.paused || this.menuPaused) return;

    this.paused = true;

    this.laneGameController.handleLaneSelection();

    this.roundDelayRemaining = 650;
    this.scheduleNextRound();
  }

  private scheduleNextRound(): void {
    this.roundDelayStartedAt = Date.now();

    this.pauseTimer = window.setTimeout(() => {
      this.pauseTimer = null;

      if (!this.active || this.menuPaused) return;

      this.round++;
      this.startRound();
    }, this.roundDelayRemaining);
  }

  showFeedback(correct: boolean): void {
    if (!this.screen || !this.car) return;
    const sound = correct ? this.correctSound : this.incorrectSound;
    sound.volume = 0.4;
    sound.currentTime = 0;
    void sound.play().catch(() => {});

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

  updateScore(): void {
    if (this.scoreText) {
        this.scoreText.textContent = String(
            this.laneGameModel.getScore()
        );
    }
}

  private updateCarPosition(): void {
    if (!this.car) return;

    this.car.style.left =
      `${this.lanePositions[this.laneGameModel.getCurrentLane().getLaneNumber() - 1]}%`;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.active || this.paused || this.menuPaused) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();

        this.laneGameController.handleCarMovement(event.key);

        this.updateCarPosition();
    }
  };

  private finishGame(): void {
    if (!this.active) return;
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
    this.active = false;
    this.menuPaused = false;
    this.pauseMenu = null;

    this.correctSound.pause();
    this.incorrectSound.pause();
    this.paused = true;
    cancelAnimationFrame(this.frameId);

    const coinsEarned = this.laneGameModel.getCorrectCount() * COINS_PER_CORRECT_ANSWER;
    this.game.state.addCoins(coinsEarned);

    this.questions.forEach((box) => {
      box.style.display = "none";
    });

    if (this.answerText) {
      this.answerText.textContent = "";
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
      gap: "12px",
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

    const finalScoreValue = this.laneGameModel.getScore();
    const correctCount = this.laneGameModel.getCorrectCount();

    const finalScore = document.createElement("div");
    finalScore.textContent = `SCORE: ${finalScoreValue}`;

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
    details.textContent = `CORRECT: ${correctCount}/${this.totalRounds} | +${coinsEarned} COINS`;
    details.style.fontSize = "clamp(9px, 1.4vw, 15px)";
    details.style.lineHeight = "1.8";
    overlay.appendChild(details);

    const balance = document.createElement("div");
    balance.textContent = `TOTAL COINS: ${this.game.state.getCoins()}`;
    balance.style.fontSize = "clamp(9px, 1.4vw, 15px)";
    overlay.appendChild(balance);
    overlay.appendChild(restart);
    // Review Wrong Answers button
    const reviewButton = document.createElement("button");

    reviewButton.textContent = "REVIEW WRONG ANSWERS";

    Object.assign(reviewButton.style, {
      padding: "12px 18px",
      backgroundColor: "#244936",
      color: "#89e5a7",
      border: "3px solid #89e5a7",
      borderRadius: "8px",
      fontFamily: this.font,
      fontSize: "clamp(8px, 1.2vw, 12px)",
      cursor: "pointer",
    });

    reviewButton.onclick = () => {
      this.game.goTo(SceneIds.WrongAnswers, {
        wrongAnswers: this.laneGameController.getWrongAnswers(),
        returnTo: SceneIds.MiniGameSelect,
      });
    };

overlay.appendChild(reviewButton);

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
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
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
    this.answerText = null;
    this.scoreText = null;
    this.roadLines = null;
    this.movingDashes = [];
    this.questions = [];
  }

  exit(): void {
    this.cleanup();
  }
}
