import {
    COUNTDOWN_SECONDS,
    DAMAGE_PER_STREAK,
    FINISH_SCREEN_MS,
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
import { vi } from "vitest";

export interface RaceControllerOptions {
    /** Where the view is added to the page. Defaults to document.body */
    parent?: HTMLElement;
    theme?: RaceTheme;
}

vi.stubGlobal('Audio', class {
    loop = false;
    muted = false;
    currentTime = 0;
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
});

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
    private lastNitroLevel = -1;
    private lastNitroActive = false;

    //Add carSound, correctAnswer and wrongAnswer here once we have audio files
    private lightCountDown = new Audio("/sounds/Light_countdown.mp3")
    private correct = new Audio("/sounds/Correct.mp3")
    private incorrect = new Audio("/sounds/Incorrect.mp3")
    private engine = new Audio("/sounds/car-engine-running.mp3")
    private rev = new Audio("/sounds/enginerev.mp3")
    private nitroUse = new Audio("/sounds/nitro.mp3")
    private engineFailure = new Audio("/sounds/Car Screech.mp3")
    private sounds: HTMLAudioElement[] = [this.lightCountDown, this.correct, 
                    this.incorrect, this.engine, this.rev, this.nitroUse, this.engineFailure];

    constructor(screenSwitcher: screenSwitcher, gameState: GameState, options: RaceControllerOptions = {}) {
        this.screenSwitcher = screenSwitcher;
        this.gameState = gameState;
        this.parent = options.parent ?? null;
        this.generator = this.createGenerator(1);
        this.engine.loop = true;

        this.model = new RaceClassModel();
        this.view = new RaceClassView(
            {
                onAnswerSubmit: (answer) => this.handleAnswer(answer),
                onNitro: () => this.handleNitroButton(),
                onPause: () => this.handlePause(),
                onResume: () => this.handleResume(),
                onMuteToggle: (muted) => this.handleMuteToggle(muted),
                onQuit: () => this.handleQuit(),
                onFinishLineCrossed: () => this.endGame(),
            },
            {
                theme: options.theme,
                skin: gameState.getCar().getSkin(),
                speedMultiplier: gameState.getCar().getSpeedMultiplier(),
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
            this.model.updateNitro(dt);
            this.syncNitroView();
        }
    }

    // ---------- Race flow ----------

    /**
     * Starts Game
     */
    startGame(): void {
        this.engine.pause();
        this.stopAllTimers();
        this.model.reset();
        this.view.setCar();
        this.lastNitroActive = false;
        this.lastNitroLevel = -1;
        this.syncNitroView();
        this.currentQuestion = null;
        this.paused = false;
        this.startCountdown();
        this.engine.play();
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
     * Decrements health per wrong answer
     */
    private decreasesHealth(): void {
        if(this.model.shouldDamageCar()){
            this.gameState.getMutableCar().inflictDamage(DAMAGE_PER_STREAK);
            this.model.resetIncorrectStreak();
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
     * Considers the question correct if nitro is used. Will later implement
     * storing the question in the question bank.
     */
    private handleNitroButton(): void{
        if(this.currentQuestion == null){
            return;
        }
        if(this.model.handleNitro()){
            this.nitroUse.play();
            this.finishQuestion(true, true);
        }
        this.syncNitroView();
    }

    private syncNitroView(): void {
        const level = this.model.getNitroLevel();
        const active = this.model.isNitroActive();
        if(level !== this.lastNitroLevel){
            this.view.setNitroLevel(level);
            this.lastNitroLevel = level;
        }
        if(active !== this.lastNitroActive){
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
            if(!usedNitro){
                this.model.chargeNitro();
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
        }
        //At 1 the view drives to the finish line, then calls endGame
    }

    /**
     * End race. The car has crossed the line, so show FINISH! before leaving.
     */
    private endGame(): void {
        this.engine.pause();
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

    // ---------- Pause menu ----------

    /**
     * View tells when pause button is pressed
     */
    private handlePause(): void {
        this.paused = true;
        this.engine.pause();
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
            this.engine.play();
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
