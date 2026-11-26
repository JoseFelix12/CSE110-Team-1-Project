import type { Question } from "../Question/QuestionModel.ts";
import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";
import { RepairMinigame } from "../Game/RepairMinigame.ts";
import { COINS_PER_CORRECT_ANSWER } from "../Game/gameConfig.ts";
import { PauseMenu } from "../RacingScreen/view/PauseMenu.ts";

const TOTAL_QUESTIONS = 10;
const HEALTH_GAIN = 20;
const HEALTH_LOSS = 10;
const ANSWER_DELAY = 500;
const FONT = '"Press Start 2P", monospace';

export class RepairSolverScreen implements Scene {
  private screen: HTMLElement | null = null;
  private timeoutId: number | null = null;
  private muted = false;
  private correctSound = new Audio("/sounds/Correct.mp3");
  private incorrectSound = new Audio("/sounds/Incorrect.mp3");
  private game: Game;
  private backgroundMusic = new Audio("/sounds/repair-music.mp3");

  constructor(game: Game) {
    this.game = game;
  }

  enter(_params: SceneParams): void {
    // Same pixel font used by Mini Game 1
    if (!document.getElementById("catch-arcade-font")) {
      const link = document.createElement("link");
      link.id = "catch-arcade-font";
      link.rel = "stylesheet";
      link.href =
        "/fonts/press-start-2p/press-start-2p.css";
      document.head.appendChild(link);
    }

    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.15;
    void this.backgroundMusic.play().catch(() => {});

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

    // Pause button, matching Catch the Answer.
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
      position: "absolute",
      left: "3%",
      top: "3%",
      width: "16%",
      height: "8%",
      backgroundColor: "#111111",
      border: "3px solid white",
      borderRadius: "8px",
      color: "white",
      fontFamily: FONT,
      fontSize: "clamp(8px, 1.2vw, 16px)",
      cursor: "pointer",
      zIndex: "25",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
    });

    screen.appendChild(pauseButton);

    // Existing repair logic, using the player's car
    const repairGame = new RepairMinigame(
      this.game.state.getMutableCar()
    );

    let questionNumber = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let finished = false;
    let menuPaused = false;
    let waitingForNextQuestion = false;
    let delayRemaining = ANSWER_DELAY;
    let delayStartedAt = 0;
    const wrongAnswers: {
      question: Question;
      playerAnswer: string | null;
    }[] = [];

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
    left: "9%",
    top: "80%",
    width: "34%",
    minHeight: "13%",
    padding: "10px 12px",
    boxSizing: "border-box",

    backgroundColor: "#25252d",
    border: "3px solid white",
    borderRadius: "8px",

    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",

    textAlign: "center",
    color: "white",
    fontFamily: FONT,
    fontSize: "clamp(8px, 1vw, 14px)",
    lineHeight: "2",
    whiteSpace: "pre-line",
    zIndex: "5",
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
      pauseButton.remove();
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;

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

      // Review Wrong Answers button
      const reviewButton = document.createElement("button");
      reviewButton.textContent = "REVIEW WRONG ANSWERS";

      Object.assign(reviewButton.style, {
        padding: "12px 18px",
        backgroundColor: "#244936",
        color: "#89e5a7",
        border: "3px solid #89e5a7",
        borderRadius: "8px",
        fontFamily: FONT,
        fontSize: "clamp(8px, 1.2vw, 12px)",
        cursor: "pointer",
      });

      reviewButton.onclick = () => {
        this.game.goTo(SceneIds.WrongAnswers, {
          wrongAnswers,
          returnTo: SceneIds.MiniGameSelect,
        });
      };

      overlay.append(
        heading,
        description,
        stats,
        coins,
        balance,
        playAgain,
        reviewButton,
        backButton
      );

      screen.appendChild(overlay);
    };

    // Preserve the remaining feedback delay if the player pauses.
    const scheduleNextQuestion = (): void => {
      delayStartedAt = Date.now();
      this.timeoutId = window.setTimeout(() => {
        this.timeoutId = null;
        if (finished || menuPaused || this.screen !== screen) return;

        waitingForNextQuestion = false;
        status.style.color = "white";
        nextQuestion();
      }, delayRemaining);
    };

    const nextQuestion = (): void => {
      if (finished || menuPaused || this.screen !== screen) return;

      if (questionNumber >= TOTAL_QUESTIONS) {
        showResults();
        return;
      }

      questionNumber++;

      const question = repairGame.generateQuestion();
      const correctAnswer = question.answer;

      questionBox.textContent = question.text;

      // One correct answer + three distractors, already shuffled
      const { choices } = repairGame.generateAnswerChoices(question, buttons.length);

      updateStatus();

      buttons.forEach((button, index) => {
        const answer = choices[index];

        button.textContent = String(answer);
        button.disabled = false;
        button.style.opacity = "1";

        button.onclick = () => {
          if (finished || menuPaused || waitingForNextQuestion || this.screen !== screen) return;

          waitingForNextQuestion = true;
          buttons.forEach(b => {
            b.disabled = true;
          });

          if (answer === correctAnswer) {
            correctCount++;
            this.correctSound.volume = 0.4;
            this.correctSound.currentTime = 0;
            void this.correctSound.play().catch(() => {});
            repairGame.fixCar(HEALTH_GAIN);
            updateStatus("CORRECT! +20 HEALTH");

            status.style.color = "#59FF72";
          } else {
            incorrectCount++;
            this.incorrectSound.volume = 0.4;
            this.incorrectSound.currentTime = 0;
            void this.incorrectSound.play().catch(() => {});

            wrongAnswers.push({
            question,
            playerAnswer: String(answer),
          });

            this.game.state
              .getMutableCar()
              .inflictDamage(HEALTH_LOSS);

            updateStatus("WRONG! -10 HEALTH");
            status.style.color = "#FF4B4B";
          }

          delayRemaining = ANSWER_DELAY;
          scheduleNextQuestion();
        };
      });
    };

    // Reuse the main race component with our mini-game styling.
    const pauseMenu = new PauseMenu({
      onResume: () => {
        if (!menuPaused || finished || this.screen !== screen) return;

        menuPaused = false;
        pauseMenu.hide();
        pauseMenu.element.style.display = "none";
        void this.backgroundMusic.play().catch(() => {});

        if (waitingForNextQuestion) {
          scheduleNextQuestion();
        } else {
          buttons.forEach(button => { button.disabled = false; });
        }
        pauseButton.focus();
      },
      onMuteToggle: () => {
        this.muted = !this.muted;
        this.backgroundMusic.muted = this.muted;
        this.correctSound.muted = this.muted;
        this.incorrectSound.muted = this.muted;
        pauseMenu.setMuted(this.muted);
      },
      onQuit: () => this.game.goTo(SceneIds.MiniGameSelect),
    });

    pauseMenu.setMuted(this.muted);

    Object.assign(pauseMenu.element.style, {
      position: "absolute",
      inset: "0",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(3px)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "30",
      display: "none",
    });

    const pausePanel = pauseMenu.element.querySelector<HTMLElement>(
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
      fontFamily: FONT,
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

    pausePanel.querySelectorAll("button").forEach(button => {
      Object.assign(button.style, {
        background: "#373740",
        border: "3px solid white",
        borderRadius: "8px",
        padding: "18px 10px",
        color: "white",
        fontFamily: FONT,
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

    pauseButton.onclick = () => {
      if (menuPaused || finished || this.screen !== screen) return;

      menuPaused = true;
      buttons.forEach(button => { button.disabled = true; });

      if (this.timeoutId !== null) {
        window.clearTimeout(this.timeoutId);
        this.timeoutId = null;
        delayRemaining = Math.max(0, delayRemaining - (Date.now() - delayStartedAt));
      }

      this.backgroundMusic.pause();
      this.correctSound.pause();
      this.incorrectSound.pause();
      pauseMenu.element.style.display = "flex";
      pauseMenu.show();
    };

    screen.appendChild(pauseMenu.element);
    document.getElementById("game")!.appendChild(screen);
    nextQuestion();
  }

  exit(): void {
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
    this.correctSound.pause();
    this.incorrectSound.pause();

    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.screen?.remove();
    this.screen = null;
  }
}
