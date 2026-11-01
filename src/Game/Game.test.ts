import { describe, it, expect, beforeEach } from "vitest";
import { Game } from "./Game.ts";
import { GameState } from "./GameState.ts";
import { SceneIds } from "./Scene.ts";
import type { Scene, SceneParams } from "./Scene.ts";

class FakeScene implements Scene {
    log: string[];
    name: string;
    constructor(name: string, log: string[]) {
        this.name = name;
        this.log = log;
    }
    enter(params: SceneParams) { this.log.push(`enter ${this.name} ${JSON.stringify(params)}`); }
    exit() { this.log.push(`exit ${this.name}`); }
    update(dt: number) { this.log.push(`update ${this.name} ${dt}`); }
}

describe("Game", () => {
    let game: Game;
    let log: string[];

    beforeEach(() => {
        log = [];
        game = new Game(new GameState(null));
        for (const id of [SceneIds.Start, SceneIds.Home, SceneIds.LevelSelect, SceneIds.Race]) {
            game.register(id, () => new FakeScene(id, log));
        }
    });

    it("starts on the start screen", () => {
        game.start();
        expect(game.getCurrentSceneId()).toBe(SceneIds.Start);
        expect(log).toEqual(["enter start {}"]);
    });

    it("exits the old scene before entering the new one and passes params", () => {
        game.start();
        game.goTo(SceneIds.Race, { levelId: 1 });
        expect(log).toEqual(["enter start {}", "exit start", 'enter race {"levelId":1}']);
    });

    it("only updates the active scene", () => {
        game.start();
        game.goTo(SceneIds.Home);
        game.tick(0.5);
        expect(log.at(-1)).toBe("update home 0.5");
    });

    it("goes back through history and falls back to home", () => {
        game.start();
        game.goTo(SceneIds.Home);
        game.goTo(SceneIds.LevelSelect);
        game.back();
        expect(game.getCurrentSceneId()).toBe(SceneIds.Home);
        game.back();
        expect(game.getCurrentSceneId()).toBe(SceneIds.Start);
        game.back();
        expect(game.getCurrentSceneId()).toBe(SceneIds.Home);
    });

    it("keeps history in order when a scene redirects inside enter()", () => {
        let redirected = false;
        game.register(SceneIds.Instructions, (g) => ({
            enter: () => {
                if (!redirected) {
                    redirected = true;
                    g.goTo(SceneIds.Home);
                }
            },
        }));
        game.start();
        game.goTo(SceneIds.Instructions);
        expect(game.getCurrentSceneId()).toBe(SceneIds.Home);
        game.back();
        expect(game.getCurrentSceneId()).toBe(SceneIds.Instructions);
        game.back();
        expect(game.getCurrentSceneId()).toBe(SceneIds.Start);
    });

    it("throws on an unregistered scene without changing state", () => {
        game.start();
        expect(() => game.goTo(SceneIds.Shop)).toThrow(/not been registered/);
        expect(game.getCurrentSceneId()).toBe(SceneIds.Start);
    });

    it("stop exits the active scene", () => {
        game.start();
        game.stop();
        expect(log.at(-1)).toBe("exit start");
        expect(game.getCurrentSceneId()).toBeNull();
    });

    it("gives scenes access to the shared GameState", () => {
        let seenCoins = -1;
        game.register(SceneIds.Shop, (g) => ({ enter: () => { seenCoins = g.state.getCoins(); } }));
        game.state.addCoins(42);
        game.goTo(SceneIds.Shop);
        expect(seenCoins).toBe(42);
    });
});
