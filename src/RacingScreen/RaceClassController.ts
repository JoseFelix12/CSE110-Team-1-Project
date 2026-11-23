import {
    CORRECT_ANSWERS_FOR_NITRO,
  COUNTDOWN_SECONDS,
  DAMAGE_PER_STREAK,
  FINISH_SCREEN_MS,
  QUESTION_TIMER,
} from "../constants.ts";
import { QuestionController } from "../Question/QuestionController.ts";
import type { QuestionType } from "../Question/QuestionController.ts";
import type { Question } from "../Question/QuestionModel.ts";
import type { LevelConfig, Operator } from "../Game/gameConfig.ts";
import type { screenSwitcher } from "../Game/Game.ts";
import type { GameState } from "../Game/GameState.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";
import { RaceClassModel } from "./RaceClassModel.ts";
import { RaceClassView } from "./RaceClassView.ts";
import type { RaceTheme } from "./RaceClassView.ts";

/** Which QuestionController question type each level operator asks */
const QUESTION_TYPES: Record<Operator, QuestionType> = {
  "+": "addition",
  "-": "subtraction",
  "*": "multiplication",
  "/": "division",
};

export interface RaceControllerOptions {
  /** Where the view is added to the page. Defaults to document.body */
  parent?: HTMLElement;
  theme?: RaceTheme;
  onRaceComplete?: (params: SceneParams) => void;
}

/**
 * RaceClassController - Runs a race: the countdown, questions, answers, nitro
 * and pausing. Register it with Game like this:
 *
 *   game.register(SceneIds.Race, (g) => new RaceClassController(
 *       { switchToScreen: (id) => g.goTo(id) },
 *       g.state,
 *   ));
 *   game.goTo(SceneIds.Race, { levelId: 1 });
 */
export class RaceClassController implements Scene {
  private model: RaceClassModel;
  private view!: RaceClassView;
  private screenSwitcher: screenSwitcher;
  private gameState: GameState;
  private onRaceComplete?: (params: SceneParams) => void;
  private raceFinished = false;
  private parent: HTMLElement | null;
  /** Forces one theme for every level (the demo uses this); otherwise each level picks its own */
  private themeOverride: RaceTheme | undefined;
  /** Makes and checks questions, and keeps the ones missed this race */
  private questions = new QuestionController();
  private level: LevelConfig;

  private questionTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private finishTimeout: ReturnType<typeof setTimeout> | null = null;
  private questionTimeRemaining = 0;
  private countdownRemaining = 0;
  private currentQuestion: Question | null = null;
  private paused = false;
  /** True from GO until the scene exits; the bots only move while this is set */
  private racing = false;
  private lastNitroLevel = -1;
  private lastNitroActive = false;
  private levelId = 1;

  //Add carSound, correctAnswer and wrongAnswer here once we have audio files
  private lightCountDown = new Audio("/sounds/Light_countdown.mp3");
  private correct = new Audio("/sounds/Correct.mp3");
  private incorrect = new Audio("/sounds/Incorrect.mp3");
  private engine = new Audio("/sounds/car-engine-running.mp3");
  private rev = new Audio("/sounds/enginerev.mp3");
  private nitroUse = new Audio("/sounds/nitro.mp3");
  private engineFailure = new Audio("/sounds/Car Screech.mp3");
  private sounds: HTMLAudioElement[] = [
    this.lightCountDown,
    this.correct,
    this.incorrect,
    this.engine,
    this.rev,
    this.nitroUse,
    this.engineFailure,
  ];

  constructor(
    screenSwitcher: screenSwitcher,
    gameState: GameState,
    options: RaceControllerOptions = {},
  ) {
    this.screenSwitcher = screenSwitcher;
    this.gameState = gameState;
    this.onRaceComplete = options.onRaceComplete;
    this.parent = options.parent ?? null;
    this.themeOverride = options.theme;
    this.level = gameState.getLevel(1);
    this.engine.loop = true;
    this.lightCountDown.volume = 0.1;
    this.rev.volume = 0.2;
    this.correct.volume = 0.2;
    this.incorrect.volume = 0.2;
    this.engineFailure.volume = 0.2;

    this.model = new RaceClassModel();
  }

  // ---------- Scene ----------
  private createView(): RaceClassView {
    const car = this.gameState.getCar();
    return new RaceClassView(
      {
        onAnswerSubmit: (a) => this.handleAnswer(a),
        onNitro: () => this.handleNitroButton(),
        onPause: () => this.handlePause(),
        onResume: () => this.handleResume(),
        onMuteToggle: (m) => this.handleMuteToggle(m),
        onQuit: () => this.handleQuit(),
        onFinishLineCrossed: () => this.endGame(),
      },
      {
        skin: car.getSkin(),
        speedMultiplier: car.getSpeedMultiplier(),
        // The bots are yellow, blue and green, so purple never matches anyone
        opponentColors: this.model.getOpponents().map((o) =>
          o.profile.color === car.getSkin() ? 'purple' : o.profile.color,
        ),
      },
    );
  }

  enter(params: SceneParams): void {
    this.levelId = typeof params.levelId === "number" ? params.levelId : 1;
    this.raceFinished = false;
    this.level = this.gameState.getLevel(this.levelId);
    this.view = this.createView();
    this.view.setTheme(this.themeOverride ?? this.level.theme);
    this.view.mount(this.parent ?? document.body);
    this.startGame();
  }

  exit(): void {
    this.racing = false;
    this.stopAllTimers();
    this.view.destroy();
  }

  update(dt: number): void {
    this.view.update(dt);
    if (!this.paused) {
      this.model.updateNitro(dt);
      this.syncNitroView();
      this.updateOpponents(dt);
    }
  }

  // ---------- Race flow ----------

    /**
     * Starts Game
     */
    startGame(): void {
        this.engine.pause();
        this.stopAllTimers();
        this.model.reset(this.gameState.getLevel(this.levelId).questionCount);
        this.questions = new QuestionController();
        this.view.setCar();
        this.lastNitroActive = false;
        this.lastNitroLevel = -1;
        this.syncNitroView();
        this.currentQuestion = null;
        this.paused = false;
        this.racing = false;
        this.startCountdown();
    }

  /**
   * Starts the race countdown
   */
  private startCountdown(): void {
    this.countdownRemaining = COUNTDOWN_SECONDS;
    this.lightCountDown.play();
    this.rev.play();
    this.view.showCountdown(this.countdownRemaining as 3 | 2 | 1);
    this.runCountdownTimer();
  }

    private runCountdownTimer(): void {
        this.countdownTimer = setInterval(() => {
            this.countdownRemaining -= 1;
            if (this.countdownRemaining > 0) {
                this.view.showCountdown(this.countdownRemaining as 3 | 2 | 1);
            } else {
                this.stopCountdownTimer();
                this.view.startRace();
                this.racing = true;
                this.engine.play();
                this.nextQuestion();
            }
        }, 1000);
    }

  private stopCountdownTimer(): void {
    if (this.countdownTimer != null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  /**
   * Handles question generation
   */
  private nextQuestion(): void {
    const { operators, minFactor, maxFactor, secondMinFactor, secondMaxFactor } = this.level;
    const operator = operators[Math.floor(Math.random() * operators.length)];
    this.currentQuestion = this.questions.generateQuestion(
      QUESTION_TYPES[operator],
      minFactor,
      maxFactor,
      secondMinFactor ?? minFactor,
      secondMaxFactor ?? maxFactor,
    );
    this.view.setQuestion(this.currentQuestion.text);
    this.startQuestionTimer();
  }

  /**
   * Questions answered wrong or timed out this race, for a review screen later
   */
  getWrongQuestions(): Question[] {
    return this.questions.getWrongQuestions();
  }

  /**
   * Start the question timer
   */
  private startQuestionTimer(): void {
    if(this.gameState.ownsUpgrade("Extra Time")){
      this.questionTimeRemaining = QUESTION_TIMER + 5;
    }
    else{
      this.questionTimeRemaining = QUESTION_TIMER;
    }
    this.view.updateTimer(this.questionTimeRemaining);
    this.runQuestionTimer();
  }

  private runQuestionTimer(): void {
    this.questionTimer = setInterval(() => {
      this.questionTimeRemaining -= 1;
      this.view.updateTimer(this.questionTimeRemaining);
      if (this.questionTimeRemaining <= 0) {
        this.questions.markWrong();
        this.finishQuestion(false);
      }
    }, 1000);
  }

  private stopQuestionTimer(): void {
    if (this.questionTimer != null) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }
  }

  /**
   * Decrements health per wrong answer
   */
  private decreasesHealth(): void {
    if (this.model.shouldDamageCar()) {
      this.gameState.getMutableCar().inflictDamage(DAMAGE_PER_STREAK);
      this.model.resetIncorrectStreak();
    }
  }

  /**
   * Handles answer checking. The view only lets digits through.
   */
  private handleAnswer(answer: string): void {
    if (this.currentQuestion !== null) {
      this.finishQuestion(this.questions.submitAnswer(answer));
    }
  }

    /**
     * Considers the question correct if nitro is used. Will later implement
     * storing the question in the question bank.
     */
    private handleNitroButton(): void{
        if(this.currentQuestion == null){
            return;
        }
        if (this.model.handleNitro(this.gameState.getCar().getHealth())) {
            this.nitroUse.play();
            this.finishQuestion(true, true);
        }
        this.syncNitroView();
    }

  private syncNitroView(): void {
    const level = this.model.getNitroLevel();
    const active = this.model.isNitroActive();
    if (level !== this.lastNitroLevel) {
      this.view.setNitroLevel(level);
      this.lastNitroLevel = level;
    }
    if (active !== this.lastNitroActive) {
      this.view.setNitroActive(active);
      this.lastNitroActive = active;
    }
  }

  /**
   * Records an answered or timed out question, then moves the race on
   */
  private finishQuestion(correct: boolean, usedNitro = false): void {
    this.stopQuestionTimer();
    this.currentQuestion = null;

    if (correct) {
      this.correct.currentTime = 0;
      this.correct.play();
      this.model.incrementCorrect_Answers();
      this.model.resetIncorrectStreak();
      if (!usedNitro) {
        if(this.gameState.ownsUpgrade("Speed Boost")){
          this.model.chargeNitro(CORRECT_ANSWERS_FOR_NITRO - 1);
        }
        else{
          this.model.chargeNitro(CORRECT_ANSWERS_FOR_NITRO);
        }
      }
    } else {
      this.incorrect.currentTime = 0;
      this.incorrect.play();
      this.engineFailure.play();
      this.model.incrementIncorrect_Answers();
      this.model.incrementIncorrectStreak();
      this.model.resetNitro();
      this.decreasesHealth();
    }
    this.view.showAnswerFeedback(correct);

    const progress = this.model.currentProgess();
    this.view.setProgress(progress);
    if (progress < 1) {
      this.nextQuestion();
    } else {
      this.model.recordFinish();
      this.view.setPlacement(this.model.getPlacement());
    }
    //At 1 the view drives to the finish line, then calls endGame
  }

  // ---------- Opponents ----------

  /**
   * Moves the bots and updates where the player is placed
   */
  private updateOpponents(dt: number): void {
    if (!this.racing) {
      return;
    }
    this.model.updateOpponents(dt);
    this.view.setOpponentProgress(
      this.model.getOpponents().map((opponent) => opponent.getProgress()),
    );
    this.view.setPlacement(this.model.getPlacement());
  }

  /**
   * End race. The car has crossed the line, so show FINISH! before leaving.
   */
  private endGame(): void {
    if (this.raceFinished) return;
    this.raceFinished = true;

    this.engine.pause();

    const correct = this.model.getCorrect_Answers();
    const incorrect = this.model.getIncorrectAnswers();
    const total = this.model.getQuestionCount();

    const opponentsBeaten = this.model.getOpponentsBeaten();
    const result = this.gameState.recordRaceResult(
      this.levelId,
      correct,
      opponentsBeaten,
    );
    this.finishTimeout = setTimeout(() => {
      this.finishTimeout = null;

      if (this.onRaceComplete) {
        this.onRaceComplete({
          mode: "race",
          levelId: this.levelId,
          correct,
          incorrect,
          total,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          placement: this.model.getPlacement(),
          opponentsBeaten,
          stars: result.stars,
          coinsEarned: result.coinsEarned,
          newBest: result.newBest,
          unlockedLevelId: result.unlockedLevelId,
        });
      } else {
        this.screenSwitcher.switchToScreen(SceneIds.LevelSelect);
      }
    }, FINISH_SCREEN_MS);
  }

  private stopAllTimers(): void {
    this.stopCountdownTimer();
    this.stopQuestionTimer();
    if (this.finishTimeout != null) {
      clearTimeout(this.finishTimeout);
      this.finishTimeout = null;
    }
  }

  // ---------- Pause menu ----------

    /**
     * View tells when pause button is pressed
     */
    private handlePause(): void {
        this.paused = true;
        this.engine.pause();
        this.lightCountDown.pause();
        this.rev.pause();
        this.stopCountdownTimer();
        this.stopQuestionTimer();
    }

    /**
     * View tells when Resume button is pressed
     */
    private handleResume(): void {
        this.paused = false;
        if (this.countdownRemaining > 0) {
            if (!this.lightCountDown.ended) this.lightCountDown.play();
            if (!this.rev.ended) this.rev.play();
            this.runCountdownTimer();
        } else {
            this.engine.play();
            if (this.currentQuestion !== null) {
                this.runQuestionTimer();
            }
        }
    }

  /**
   * View tells when Quit button is pressed
   */
  private handleQuit(): void {
    this.stopAllTimers();
    this.screenSwitcher.switchToScreen(SceneIds.LevelSelect);
  }

  /**
   * View tells when the audio button is pressed
   */
  private handleMuteToggle(muted: boolean): void {
    this.sounds.forEach((sound) => {
      sound.muted = muted;
    });
  }
}
