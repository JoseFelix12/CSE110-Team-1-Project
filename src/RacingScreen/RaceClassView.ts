import type { SkinColor } from '../Game/gameConfig.ts';
import { Background, CityBackground, DesertBackground, StadiumBackground } from './view/Background.ts';
import { CarSprite } from './view/CarSprite.ts';
import type { CarColor } from './view/CarSprite.ts';
import { PauseMenu } from './view/PauseMenu.ts';
import { QuestionBar } from './view/QuestionBar.ts';
import { DirtRoad, RaceTrackRoad, Road, StreetRoad } from './view/Road.ts';
import { FinishLine, TrafficLight } from './view/TrackProps.ts';
import type { CountdownValue } from './view/TrackProps.ts';

/** Low resolution drawing size; CSS scales it up for the retro pixel look */
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 270;
const HORIZON_Y = 150;
/** The player drives in the nearest lane; bots fill the lanes behind, farthest first */
const CAR_GROUND_Y = 249;
const OPPONENT_LANE_GROUND_Y = [186, 207, 228];
const CAR_SCREEN_X = 110;
/** How far ahead a bot is drawn for each full race of progress it leads by */
const LEAD_PIXELS = 600;
const TRAFFIC_LIGHT_SCREEN_X = 300;
const START_LINE_SCREEN_X = CAR_SCREEN_X + CarSprite.WIDTH + 4;

/** Speeds in canvas pixels per second */
const CRUISE_SPEED = 190;
const CORRECT_SPEED = 280;
const WRONG_SPEED = 90;
const NITRO_SPEED = 430;
/** How quickly the car reaches its target speed; higher is snappier */
const ACCELERATION = 3;
const SPEED_CHANGE_SECONDS = 0.9;
/** How far past the screen edge the finish line appears */
const FINISH_DISTANCE = 800;
const GO_MESSAGE_SECONDS = 0.9;
const PROGRESS_EASING = 5;

export type RaceTheme = 'dirt' | 'raceTrack' | 'street';

/** Pairs each road type with its scenery. Add new themes here. */
const RACE_THEMES: Record<RaceTheme, () => { road: Road; background: Background }> = {
    dirt: () => ({ road: new DirtRoad(), background: new DesertBackground() }),
    raceTrack: () => ({ road: new RaceTrackRoad(), background: new StadiumBackground() }),
    street: () => ({ road: new StreetRoad(), background: new CityBackground() }),
};

/** What the view tells the controller about */
export interface RaceViewHandlers {
    onAnswerSubmit(answer: string): void;
    onNitro(): void;
    /** The world has frozen and the menu is open; stop the timers */
    onPause(): void;
    /** The menu has closed and the world is moving; restart the timers */
    onResume(): void;
    onMuteToggle(muted: boolean): void;
    onQuit(): void;
    /** The car drove over the finish line after setProgress(1) */
    onFinishLineCrossed(): void;
}

export interface RaceViewOptions {
    theme?: RaceTheme;
    skin?: SkinColor;
    /** From GameState.getSpeedMultiplier() */
    speedMultiplier?: number;
    muted?: boolean;
    /** One car per bot, in the same order as setOpponentProgress. At most 3. */
    opponentColors?: CarColor[];
}

type RacePhase = 'countdown' | 'racing' | 'finishing' | 'finished';

interface OpponentCar {
    sprite: CarSprite;
    groundY: number;
    targetProgress: number;
    shownProgress: number;
    /** Distance driven since this bot finished, so it pulls away */
    finishedDistance: number;
}

function ordinal(place: number): string {
    const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
    return `${place}${suffixes[place] ?? 'th'}`;
}

/**
 * RaceClassView - Everything the player sees during a race. It only draws and
 * reports input; RaceClassController decides what happens.
 *
 * The controller's Scene methods should call mount() in enter(), update(dt) in
 * update(dt) and destroy() in exit(), so the view runs on Game's frame loop.
 */
export class RaceClassView {
    private handlers: RaceViewHandlers;
    private root: HTMLElement;
    private style: HTMLStyleElement;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private pauseButton: HTMLButtonElement;
    private questionBar: QuestionBar;
    private pauseMenu: PauseMenu;

    private road: Road;
    private background: Background;
    private car: CarSprite;
    private trafficLight = new TrafficLight();
    private finishLine = new FinishLine();

    private phase: RacePhase = 'countdown';
    private paused = false;
    private muted: boolean;
    private speedMultiplier: number;

    private cameraX = 0;
    private speed = 0;
    private temporarySpeed = 0;
    private temporarySpeedLeft = 0;
    private nitroActive = false;
    private countdown: CountdownValue | null = null;
    private goMessageLeft = 0;
    private targetProgress = 0;
    private shownProgress = 0;
    private finishWorldX: number | null = null;
    private finishStartCameraX = 0;
    private opponents: OpponentCar[];
    private placement = 1;

    constructor(handlers: RaceViewHandlers, options: RaceViewOptions = {}) {
        this.handlers = handlers;
        this.muted = options.muted ?? false;
        this.speedMultiplier = options.speedMultiplier ?? 1;
        this.car = new CarSprite(options.skin ?? 'red');
        this.opponents = (options.opponentColors ?? [])
            .slice(0, OPPONENT_LANE_GROUND_Y.length)
            .map((color, index) => ({
                sprite: new CarSprite(color),
                groundY: OPPONENT_LANE_GROUND_Y[index],
                targetProgress: 0,
                shownProgress: 0,
                finishedDistance: 0,
            }));
        const theme = RACE_THEMES[options.theme ?? 'raceTrack']();
        this.road = theme.road;
        this.background = theme.background;

        this.style = document.createElement('style');
        this.style.textContent = RACE_VIEW_CSS;

        this.root = document.createElement('div');
        this.root.className = 'race-view';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'race-view__canvas';
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.canvas.addEventListener('pointerdown', this.keepInputFocused);
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas 2D is not available');
        }
        this.ctx = ctx;

        this.pauseButton = document.createElement('button');
        this.pauseButton.type = 'button';
        this.pauseButton.className = 'race-button race-view__pause';
        this.pauseButton.textContent = 'Pause';
        this.pauseButton.addEventListener('click', this.pause);

        this.questionBar = new QuestionBar({
            onSubmit: (answer) => this.handlers.onAnswerSubmit(answer),
            onNitro: () => this.handlers.onNitro(),
        });

        this.pauseMenu = new PauseMenu({
            onResume: this.resume,
            onMuteToggle: this.toggleMute,
            onQuit: () => this.handlers.onQuit(),
        });
        this.pauseMenu.setMuted(this.muted);

        this.root.append(this.canvas, this.pauseButton, this.questionBar.element, this.pauseMenu.element);
    }

    // ---------- Setup ----------

    /**
     * Adds the view to the page
     */
    mount(parent: HTMLElement): void {
        document.head.appendChild(this.style);
        parent.appendChild(this.root);
        window.addEventListener('keydown', this.handleWindowKeyDown);
        this.render();
    }

    /**
     * Removes the view from the page
     */
    destroy(): void {
        window.removeEventListener('keydown', this.handleWindowKeyDown);
        this.questionBar.destroy();
        this.root.remove();
        this.style.remove();
    }

    /**
     * Advances and redraws the race. Does nothing while paused.
     */
    update(dt: number): void {
        if (this.paused) {
            return;
        }
        this.advance(dt);
        this.render();
    }

    // ---------- Called by the controller ----------

    /**
     * Puts the car back at the start line, stopped, and clears the last race
     */
    setCar(): void {
        this.phase = 'countdown';
        this.paused = false;
        this.cameraX = 0;
        this.speed = 0;
        this.temporarySpeedLeft = 0;
        this.nitroActive = false;
        this.countdown = null;
        this.goMessageLeft = 0;
        this.targetProgress = 0;
        this.shownProgress = 0;
        this.finishWorldX = null;
        this.finishStartCameraX = 0;
        this.placement = 1;
        this.car.reset();
        this.opponents.forEach((opponent) => {
            opponent.targetProgress = 0;
            opponent.shownProgress = 0;
            opponent.finishedDistance = 0;
            opponent.sprite.reset();
        });
        this.questionBar.reset();
        this.pauseMenu.hide();
        this.pauseButton.hidden = false;
        this.render();
    }

    /**
     * Shows 3, 2 or 1 on the traffic light
     */
    showCountdown(value: 3 | 2 | 1): void {
        this.countdown = value;
    }

    /**
     * Turns the light green, shows GO and sets the car moving
     */
    startRace(): void {
        this.countdown = 0;
        this.goMessageLeft = GO_MESSAGE_SECONDS;
        this.phase = 'racing';
        this.questionBar.setEnabled(true);
    }

    /**
     * Shows a new question and clears the textbox
     */
    setQuestion(text: string): void {
        this.questionBar.setQuestion(text);
    }

    /**
     * Shows the seconds left on the current question
     */
    updateTimer(seconds: number): void {
        this.questionBar.setTimer(seconds);
    }

    /**
     * Moves the progress meter, from 0 to 1. At 1 the finish line appears and
     * onFinishLineCrossed fires once the car reaches it.
     */
    setProgress(progress: number): void {
        this.targetProgress = Math.min(1, Math.max(0, progress));
    }

    /**
     * Flashes the textbox, then speeds the car up or makes it stumble
     */
    showAnswerFeedback(correct: boolean): void {
        this.questionBar.showFeedback(correct);
        this.temporarySpeed = correct ? CORRECT_SPEED : WRONG_SPEED;
        this.temporarySpeedLeft = SPEED_CHANGE_SECONDS;
        if (!correct) {
            this.car.wobble();
        }
    }

    /**
     * Sets how full the nitro bar is, from 0 to 1
     */
    setNitroLevel(level: number): void {
        this.questionBar.setNitroLevel(level);
    }

    /**
     * Turns the nitro speed and exhaust flame on or off
     */
    setNitroActive(active: boolean): void {
        this.nitroActive = active;
        this.questionBar.setNitroActive(active);
    }

    /**
     * Moves each bot, from 0 to 1, in the order of opponentColors
     */
    setOpponentProgress(progress: readonly number[]): void {
        this.opponents.forEach((opponent, index) => {
            opponent.targetProgress = Math.min(1, Math.max(0, progress[index] ?? 0));
        });
    }

    /**
     * Shows the player's place, 1 = first
     */
    setPlacement(place: number): void {
        this.placement = place;
    }

    // ---------- Simulation ----------

    private advance(dt: number): void {
        const easing = Math.min(1, dt * ACCELERATION);
        this.speed += (this.getTargetSpeed() - this.speed) * easing;
        this.cameraX += this.speed * dt;

        this.shownProgress += (this.targetProgress - this.shownProgress) * Math.min(1, dt * PROGRESS_EASING);
        this.temporarySpeedLeft = Math.max(0, this.temporarySpeedLeft - dt);
        this.goMessageLeft = Math.max(0, this.goMessageLeft - dt);
        this.car.update(dt, this.speed);
        this.finishLine.update(dt);
        this.advanceOpponents(dt);

        if (this.phase === 'racing' && this.targetProgress >= 1) {
            this.beginFinish();
        }
        if (this.phase === 'finishing' && this.finishWorldX !== null) {
            if (this.cameraX + CAR_SCREEN_X + CarSprite.WIDTH >= this.finishWorldX) {
                this.phase = 'finished';
                this.pauseButton.hidden = true;
                this.handlers.onFinishLineCrossed();
            }
        }
    }

    private getTargetSpeed(): number {
        if (this.phase === 'countdown' || this.phase === 'finished') {
            return 0;
        }
        if (this.nitroActive) {
            return NITRO_SPEED * this.speedMultiplier;
        }
        const speed = this.temporarySpeedLeft > 0 ? this.temporarySpeed : CRUISE_SPEED;
        return speed * this.speedMultiplier;
    }

    private advanceOpponents(dt: number): void {
        const easing = Math.min(1, dt * PROGRESS_EASING);
        const botSpeed = this.phase === 'countdown' ? 0 : CRUISE_SPEED;
        for (const opponent of this.opponents) {
            opponent.shownProgress += (opponent.targetProgress - opponent.shownProgress) * easing;
            if (opponent.targetProgress >= 1) {
                opponent.finishedDistance += botSpeed * dt;
            }
            opponent.sprite.update(dt, botSpeed);
        }
    }

    /**
     * Where a bot is drawn: ahead of or behind the player by how much it leads,
     * plus how far each has driven since finishing
     */
    private getOpponentScreenX(opponent: OpponentCar): number {
        const lead = (opponent.shownProgress - this.shownProgress) * LEAD_PIXELS;
        const playerFinishedDistance = this.finishWorldX === null ? 0 : this.cameraX - this.finishStartCameraX;
        return CAR_SCREEN_X + lead + opponent.finishedDistance - playerFinishedDistance;
    }

    private beginFinish(): void {
        this.phase = 'finishing';
        this.finishStartCameraX = this.cameraX;
        this.finishWorldX = this.cameraX + FINISH_DISTANCE;
        this.setNitroActive(false);
        this.questionBar.setEnabled(false);
    }

    // ---------- Drawing ----------

    private render(): void {
        const ctx = this.ctx;
        this.background.draw(ctx, this.cameraX, CANVAS_WIDTH, HORIZON_Y);
        this.road.draw(ctx, this.cameraX, CANVAS_WIDTH, HORIZON_Y, CANVAS_HEIGHT - HORIZON_Y);
        this.drawStartLine();
        this.trafficLight.draw(ctx, TRAFFIC_LIGHT_SCREEN_X - this.cameraX, HORIZON_Y + 6, this.countdown);
        if (this.finishWorldX !== null) {
            this.finishLine.draw(ctx, this.finishWorldX - this.cameraX, HORIZON_Y, CANVAS_HEIGHT - HORIZON_Y);
        }
        // Farthest lane first so nearer cars overlap it
        for (const opponent of this.opponents) {
            const x = this.getOpponentScreenX(opponent);
            if (x > -CarSprite.WIDTH && x < CANVAS_WIDTH) {
                opponent.sprite.draw(ctx, x, opponent.groundY, this.phase !== 'countdown', false);
            }
        }
        const moving = this.speed > 1;
        this.car.draw(ctx, CAR_SCREEN_X, CAR_GROUND_Y, moving, this.nitroActive);
        this.drawPlayerMarker();
        this.drawProgressMeter();
        this.drawMessage();
    }

    private drawStartLine(): void {
        const x = Math.round(START_LINE_SCREEN_X - this.cameraX);
        if (x > -8) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x, HORIZON_Y, 6, CANVAS_HEIGHT - HORIZON_Y);
        }
    }

    /**
     * "YOU" and an arrow on the left of the player's car, clear of the nitro flame
     */
    private drawPlayerMarker(): void {
        const ctx = this.ctx;
        const centerY = CAR_GROUND_Y - 16;
        const arrowTip = CAR_SCREEN_X - 34;

        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#111111';
        ctx.strokeText('YOU', arrowTip - 11, centerY);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('YOU', arrowTip - 11, centerY);

        // Pixel arrow pointing right: a dark outline, then the white arrow inside it
        const drawArrow = (color: string, grow: number): void => {
            ctx.fillStyle = color;
            ctx.fillRect(arrowTip - 9 - grow, centerY - 1 - grow, 5 + grow, 3 + grow * 2);
            for (let column = 0; column < 5; column++) {
                const half = 4 - column;
                ctx.fillRect(arrowTip - 5 + column, centerY - half - grow, 1 + grow, half * 2 + 1 + grow * 2);
            }
        };
        drawArrow('#111111', 1);
        drawArrow('#ffffff', 0);
    }

    private drawProgressMeter(): void {
        const ctx = this.ctx;
        const left = 16;
        const width = 200;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(left - 4, 12, width + 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(left, 17, width, 2);
        ctx.fillStyle = '#ffd60a';
        ctx.fillRect(left, 17, Math.round(width * this.shownProgress), 2);
        for (const opponent of this.opponents) {
            ctx.fillStyle = opponent.sprite.getBodyColor();
            ctx.fillRect(left + Math.round((width - 4) * opponent.shownProgress), 15, 4, 6);
        }
        ctx.fillStyle = '#ff3b30';
        ctx.fillRect(left + Math.round((width - 6) * this.shownProgress), 14, 6, 8);

        if (this.opponents.length > 0) {
            const label = `${ordinal(this.placement)} / ${this.opponents.length + 1}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(left + width + 10, 8, 64, 20);
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, left + width + 42, 19);
        }
    }

    private drawMessage(): void {
        let message = '';
        let color = '#ffffff';
        if (this.phase === 'countdown' && this.countdown !== null) {
            message = String(this.countdown);
        } else if (this.goMessageLeft > 0) {
            message = 'GO!';
            color = '#30d158';
        } else if (this.phase === 'finished') {
            message = 'FINISH!';
            color = '#ffd60a';
        }
        if (message === '') {
            return;
        }

        const ctx = this.ctx;
        ctx.font = 'bold 56px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#111111';
        ctx.strokeText(message, CANVAS_WIDTH / 2 + 80, 76);
        ctx.fillStyle = color;
        ctx.fillText(message, CANVAS_WIDTH / 2 + 80, 76);

        if (this.phase === 'finished' && this.opponents.length > 0) {
            const placeText = `${ordinal(this.placement).toUpperCase()} PLACE`;
            ctx.font = 'bold 28px "Courier New", monospace';
            ctx.lineWidth = 6;
            ctx.strokeText(placeText, CANVAS_WIDTH / 2 + 80, 118);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(placeText, CANVAS_WIDTH / 2 + 80, 118);
        }
    }

    // ---------- Pause menu ----------

    private pause = (): void => {
        if (this.paused || this.phase === 'finished') {
            return;
        }
        this.paused = true;
        this.questionBar.setEnabled(false);
        this.pauseMenu.show();
        this.handlers.onPause();
    };

    private resume = (): void => {
        if (!this.paused) {
            return;
        }
        this.paused = false;
        this.pauseMenu.hide();
        this.questionBar.setEnabled(this.phase === 'racing');
        this.handlers.onResume();
    };

    private toggleMute = (): void => {
        this.muted = !this.muted;
        this.pauseMenu.setMuted(this.muted);
        this.handlers.onMuteToggle(this.muted);
    };

    private handleWindowKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            if (this.paused) {
                this.resume();
            } else {
                this.pause();
            }
        }
    };

    private keepInputFocused = (event: Event): void => {
        event.preventDefault();
        this.questionBar.focus();
    };
}

const RACE_VIEW_CSS = `
.race-view {
    position: relative;
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    overflow: hidden;
    background: #17181c;
    color: #ffffff;
    font-family: "Courier New", monospace;
    border: 4px solid #000000;
    box-sizing: border-box;
}
.race-view *, .race-view *::before, .race-view *::after { box-sizing: border-box; }
.race-view [hidden] { display: none !important; }
.race-view__canvas {
    display: block;
    width: 100%;
    height: auto;
    image-rendering: pixelated;
}
.race-button {
    min-height: 44px;
    padding: 8px 16px;
    background: #ffd60a;
    color: #111111;
    border: 3px solid #000000;
    box-shadow: 3px 3px 0 #000000;
    font: bold 16px "Courier New", monospace;
    cursor: pointer;
}
.race-button:hover:not(:disabled) { background: #ffe661; }
.race-button:active:not(:disabled) { transform: translate(3px, 3px); box-shadow: none; }
.race-button:focus-visible { outline: 3px solid #ffffff; outline-offset: 2px; }
.race-button:disabled { background: #55585f; color: #c9ccd3; cursor: not-allowed; }
.race-view__pause { position: absolute; top: 8px; right: 8px; }
.race-bar {
    display: grid;
    grid-template-columns: 1fr minmax(120px, 180px) minmax(160px, 220px);
    gap: 16px;
    align-items: center;
    padding: 12px 16px;
    border-top: 4px solid #000000;
    background: #23263a;
}
.race-bar__question-area { display: flex; align-items: baseline; gap: 16px; min-width: 0; }
.race-bar__question { font-size: 32px; font-weight: bold; min-height: 40px; }
.race-bar__timer { font-size: 18px; font-weight: bold; color: #c9ccd3; }
.race-bar__timer--low { color: #ff6b61; }
.race-bar__input {
    width: 100%;
    min-height: 48px;
    padding: 6px 10px;
    background: #ffffff;
    color: #111111;
    border: 3px solid #000000;
    font: bold 24px "Courier New", monospace;
}
.race-bar__input:focus { outline: 3px solid #ffd60a; outline-offset: 1px; }
.race-bar__input:disabled { background: #c9ccd3; }
.race-bar__input--correct { background: #7ee89a; }
.race-bar__input--wrong { background: #ff9a92; }
.race-bar__nitro { display: flex; align-items: center; gap: 8px; }
.race-bar__nitro-meter {
    flex: 1;
    height: 24px;
    min-width: 60px;
    background: #111111;
    border: 3px solid #000000;
}
.race-bar__nitro-fill { width: 0; height: 100%; background: #2fb8ff; transition: width 0.15s linear; }
.race-bar__nitro-fill--active { background: #ff8a1f; }
.race-bar__nitro-button { padding: 8px; }
.race-bar__nitro-button--ready { background: #2fb8ff; }
.race-bar__nitro-button--ready:hover:not(:disabled) { background: #6fcfff; }
.race-pause {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.7);
}
.race-pause__panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(280px, 100%);
    padding: 20px;
    background: #23263a;
    border: 4px solid #000000;
}
.race-pause__title { margin: 0 0 4px; font-size: 28px; text-align: center; }
@media (max-width: 640px) {
    .race-bar { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; padding: 10px 16px; }
    .race-bar__question-area { grid-column: 1 / -1; justify-content: space-between; }
    .race-bar__question { font-size: 26px; min-height: 32px; }
    .race-bar__nitro-meter { min-width: 30px; }
}
`;
