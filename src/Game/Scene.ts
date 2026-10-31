import type { Game } from './Game.ts';

/**
 * Names of every screen the Game can switch to.
 * Add a line here when you create a new screen.
 */
export const SceneIds = {
    Start: 'start',
    Home: 'home',
    LevelSelect: 'levelSelect',
    Race: 'race',
    MiniGameSelect: 'miniGameSelect',
    MiniGame1: 'miniGame1',
    MiniGame2: 'miniGame2',
    Shop: 'shop',
    Instructions: 'instructions',
} as const;

export type SceneId = typeof SceneIds[keyof typeof SceneIds];

/** Extra data passed when switching scenes, e.g. { levelId: 1 } for the race */
export type SceneParams = Record<string, unknown>;

/**
 * Scene - What every screen (view) implements so the Game can manage it.
 */
export interface Scene {
    /** Called when the scene becomes active. Build the DOM / start timers here. */
    enter(params: SceneParams): void;

    /** Called when leaving the scene. Remove DOM / stop timers here. */
    exit?(): void;

    /** Called every frame while active, with seconds since the last frame. */
    update?(dt: number): void;
}

/** Creates a fresh scene each time it is entered (Factory pattern) */
export type SceneFactory = (game: Game) => Scene;
