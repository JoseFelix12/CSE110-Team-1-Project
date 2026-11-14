import { GameState } from './GameState.ts';
import { SceneIds } from './Scene.ts';
import type { Scene, SceneFactory, SceneId, SceneParams } from './Scene.ts';

/**
 * Game - Scene manager. Owns the GameState, switches between screens,
 * and runs the frame loop that calls the active scene's update().
 *
 * Usage:
 *   const game = new Game();
 *   game.register(SceneIds.Start, (g) => new StartScreen(g));
 *   game.register(SceneIds.Race, (g) => new RaceScreen(g));
 *   game.start();
 *   // inside a screen: this.game.goTo(SceneIds.Race, { levelId: 1 });
 */
export class Game {
    readonly state: GameState;

    private factories = new Map<SceneId, SceneFactory>();
    private current: Scene | null = null;
    private currentId: SceneId | null = null;
    private history: SceneId[] = [];
    private frameId: number | null = null;
    private lastFrameTime: number | null = null;

    constructor(state: GameState = new GameState()) {
        this.state = state;
    }

    /**
     * Registers the factory used to build a scene
     */
    register(id: SceneId, factory: SceneFactory): void {
        this.factories.set(id, factory);
    }

    /**
     * Switches to a scene, exiting the current one first
     */
    goTo(id: SceneId, params: SceneParams = {}): void {
        // Push first so a scene that calls goTo() inside enter() keeps history in order
        this.getFactory(id);
        this.history.push(id);
        this.switchTo(id, params);
    }

    /**
     * Returns to the previous scene, or Home if there is none
     */
    back(params: SceneParams = {}): void {
        this.history.pop();
        const previous = this.history[this.history.length - 1] ?? SceneIds.Home;
        if (this.history.length === 0) {
            this.history.push(previous);
        }
        this.switchTo(previous, params);
    }

    /**
     * Gets the id of the active scene
     */
    getCurrentSceneId(): SceneId | null {
        return this.currentId;
    }

    /**
     * Opens the first scene and starts the frame loop (in a browser)
     */
    start(firstScene: SceneId = SceneIds.Start): void {
        this.goTo(firstScene);
        if (typeof requestAnimationFrame !== 'undefined') {
            this.frameId = requestAnimationFrame(this.loop);
        }
    }

    /**
     * Stops the frame loop and exits the active scene
     */
    stop(): void {
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        this.lastFrameTime = null;
        this.current?.exit?.();
        this.current = null;
        this.currentId = null;
    }

    /**
     * Advances the active scene by dt seconds
     */
    tick(dt: number): void {
        this.current?.update?.(dt);
    }

    private loop = (time: number): void => {
        // Cap dt so switching browser tabs doesn't make the car teleport
        const dt = this.lastFrameTime === null ? 0 : Math.min((time - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = time;
        this.tick(dt);
        this.frameId = requestAnimationFrame(this.loop);
    };

    private getFactory(id: SceneId): SceneFactory {
        const factory = this.factories.get(id);
        if (!factory) {
            throw new Error(`Scene "${id}" has not been registered`);
        }
        return factory;
    }

    private switchTo(id: SceneId, params: SceneParams): void {
        const factory = this.getFactory(id);
        this.current?.exit?.();
        this.current = factory(this);
        this.currentId = id;
        this.current.enter(params);
    }
}
export interface screenSwitcher {
    switchToScreen(id: SceneId): void;
}
