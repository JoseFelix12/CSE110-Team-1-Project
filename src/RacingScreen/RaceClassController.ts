import {
    COUNTDOWN_SECONDS,
    FINISH_SCREEN_MS,
    NITRO_PER_CORRECT_ANSWER,
    NITRO_SECONDS,
    QUESTION_TIMER,
} from "../constants.ts";
import { checkAnswer } from "../answerChecker.ts";
import { createQuestionGenerator } from "../questionGenerator.ts";
import type { Question, QuestionGenerator } from "../questionGenerator.ts";
import type { screenSwitcher } from "../Game/Game.ts";
import type { GameState } from "../Game/GameState.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";
import { RaceClassModel } from "./RaceClassModel.ts";
import { RaceClassView } from "./RaceClassView.ts";
import type { RaceTheme } from "./RaceClassView.ts";

export interface RaceControllerOptions {
    /** Where the view is added to the page. Defaults to document.body */
    parent?: HTMLElement;
    theme?: RaceTheme;
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
    private view: RaceClassView;
    private screenSwitcher: screenSwitcher;
    private gameState: GameState;
    private parent: HTMLElement | null;
    private generator: QuestionGenerator;

    private questionTimer: ReturnType<typeof setInterval> | null = null;
    private countdownTimer: ReturnType<typeof setInterval> | null = null;
    private finishTimeout: ReturnType<typeof setTimeout> | null = null;
    private questionTimeRemaining = 0;
    private countdownRemaining = 0;
    private currentQuestion: Question | null = null;
    private paused = false;
    private nitroLevel = 0;
    private nitroTimeRemaining = 0;

    //Add carSound, correctAnswer and wrongAnswer here once we have audio files
    private sounds: HTMLAudioElement[] = [];

    constructor(screenSwitcher: screenSwitcher, gameState: GameState, options: RaceControllerOptions = {}) {
        this.screenSwitcher = screenSwitcher;
        this.gameState = gameState;
        this.parent = options.parent ?? null;
        this.generator = this.createGenerator(1);

        this.model = new RaceClassModel();
        this.view = new RaceClassView(
            {
                onAnswerSubmit: (answer) => this.handleAnswer(answer),
                onNitro: () => this.handleNitro(),
                onPause: () => this.handlePause(),
                onResume: () => this.handleResume(),
                onMuteToggle: (muted) => this.handleMuteToggle(muted),
                onQuit: () => this.handleQuit(),
                onFinishLineCrossed: () => this.endGame(),
            },
            {
                theme: options.theme,
                skin: gameState.getSelectedSkin(),
                speedMultiplier: gameState.getSpeedMultiplier(),
            },
        );
    }

    // ---------- Scene ----------

    enter(params: SceneParams): void {
        const levelId = typeof params.levelId === "number" ? params.levelId : 1;
        this.generator = this.createGenerator(levelId);
        this.view.mount(this.parent ?? document.body);
        this.startGame();
    }

    exit(): void {
        this.stopAllTimers();
        this.view.destroy();
    }

    update(dt: number): void {
        this.view.update(dt);
        if (!this.paused) {
            this.updateNitro(dt);
        }
    }

    // ---------- Race flow ----------

    /**
     * Starts Game
     */
    startGame(): void {
        this.stopAllTimers();
        this.model.reset();
        this.view.setCar();
        this.currentQuestion = null;
        this.paused = false;
        this.nitroLevel = 0;
        this.nitroTimeRemaining = 0;
        this.startCountdown();
    }

    /**
     * Starts the race countdown
     */
    private startCountdown(): void {
        this.countdownRemaining = COUNTDOWN_SECONDS;
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
        this.currentQuestion = this.generator.nextQuestion();
        this.view.setQuestion(this.currentQuestion.text);
        this.startQuestionTimer();
    }

    private createGenerator(levelId: number): QuestionGenerator {
        const level = this.gameState.getLevel(levelId);
        return createQuestionGenerator({ operators: level.operators, min: 1, max: level.maxFactor });
    }

    /**
     * Start the question timer
     */
    private startQuestionTimer(): void {
        this.questionTimeRemaining = QUESTION_TIMER;
        this.view.updateTimer(this.questionTimeRemaining);
        this.runQuestionTimer();
    }

    private runQuestionTimer(): void {
        this.questionTimer = setInterval(() => {
            this.questionTimeRemaining -= 1;
            this.view.updateTimer(this.questionTimeRemaining);
            if (this.questionTimeRemaining <= 0) {
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
     * Handles answer checking. The view only lets digits through.
     */
    private handleAnswer(answer: string): void {
        if (this.currentQuestion !== null) {
            this.finishQuestion(checkAnswer(this.currentQuestion, answer));
        }
    }

    /**
     * Records an answered or timed out question, then moves the race on
     */
    private finishQuestion(correct: boolean): void {
        this.stopQuestionTimer();
        this.currentQuestion = null;

        if (correct) {
            this.model.incrementCorrect_Answers();
            this.model.incrementStreak();
            this.model.resetIncorrectStreak();
            this.chargeNitro();
        } else {
            this.model.incrementIncorrect_Answers();
            this.model.incrementIncorrectStreak();
            this.model.resetcorrectStreak();
            this.model.decreasesHealth();
        }
        this.view.showAnswerFeedback(correct);

        const progress = this.model.currentProgess();
        this.view.setProgress(progress);
        if (progress < 1) {
            this.nextQuestion();
        }
        //At 1 the view drives to the finish line, then calls endGame
    }

    /**
     * End race. The car has crossed the line, so show FINISH! before leaving.
     */
    private endGame(): void {
        this.finishTimeout = setTimeout(() => {
            this.finishTimeout = null;
            this.screenSwitcher.switchToScreen(SceneIds.LevelSelect);
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

    // ---------- Nitro ----------

    private chargeNitro(): void {
        if (this.nitroTimeRemaining <= 0) {
            this.nitroLevel = Math.min(1, this.nitroLevel + NITRO_PER_CORRECT_ANSWER);
            this.view.setNitroLevel(this.nitroLevel);
        }
    }

    private handleNitro(): void {
        if (this.nitroLevel >= 1 && this.nitroTimeRemaining <= 0) {
            this.nitroTimeRemaining = NITRO_SECONDS;
            this.view.setNitroActive(true);
        }
    }

    private updateNitro(dt: number): void {
        if (this.nitroTimeRemaining <= 0) {
            return;
        }
        this.nitroTimeRemaining -= dt;
        if (this.nitroTimeRemaining > 0) {
            this.view.setNitroLevel(this.nitroTimeRemaining / NITRO_SECONDS);
        } else {
            this.nitroLevel = 0;
            this.view.setNitroActive(false);
            this.view.setNitroLevel(0);
        }
    }

    // ---------- Pause menu ----------

    /**
     * View tells when pause button is pressed
     */
    private handlePause(): void {
        this.paused = true;
        this.stopCountdownTimer();
        this.stopQuestionTimer();
    }

    /**
     * View tells when Resume button is pressed
     */
    private handleResume(): void {
        this.paused = false;
        if (this.countdownRemaining > 0) {
            this.runCountdownTimer();
        } else if (this.currentQuestion !== null) {
            this.runQuestionTimer();
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
