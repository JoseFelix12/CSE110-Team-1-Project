import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameState, SAVE_KEY, calculateStars } from "./GameState.ts";
import type { StorageLike } from "./GameState.ts";
import { ENGINE_UPGRADE_PRICES, LEVELS, MAX_SHIELDS, SKIN_PRICES, UPGRADE_PRICES } from "./gameConfig.ts";
import type { ReadonlyCar } from "./Car.ts";

class MemoryStorage implements StorageLike {
    items = new Map<string, string>();
    getItem(key: string) { return this.items.get(key) ?? null; }
    setItem(key: string, value: string) { this.items.set(key, value); }
    removeItem(key: string) { this.items.delete(key); }
}

describe("calculateStars", () => {
    it("gives 1 star per opponent beaten", () => {
        expect(calculateStars(0)).toBe(0);
        expect(calculateStars(1)).toBe(1);
        expect(calculateStars(2)).toBe(2);
        expect(calculateStars(3)).toBe(3);
    });

    it("keeps stars between 0 and 3", () => {
        expect(calculateStars(-1)).toBe(0);
        expect(calculateStars(5)).toBe(3);
    });
});

describe("GameState", () => {
    let storage: MemoryStorage;
    let state: GameState;
    let car: ReadonlyCar;

    beforeEach(() => {
        storage = new MemoryStorage();
        state = new GameState(storage);
        car = state.getCar();
    });

    it("starts with only level 1 unlocked", () => {
        const levels = state.getLevels();
        expect(levels).toHaveLength(LEVELS.length);
        expect(levels[0].unlocked).toBe(true);
        expect(levels.slice(1).every((l) => !l.unlocked)).toBe(true);
        expect(state.getCurrentLevelId()).toBe(1);
    });

    it("unlocks the next level after earning a star", () => {
        const result = state.recordRaceResult(1, 15, 3);
        expect(result.stars).toBe(3);
        expect(result.newBest).toBe(true);
        expect(result.unlockedLevelId).toBe(2);
        expect(state.isLevelUnlocked(2)).toBe(true);
        expect(state.getCurrentLevelId()).toBe(2);
    });

    it("does not unlock the next level with zero stars", () => {
        const result = state.recordRaceResult(1, 15, 0);
        expect(result.stars).toBe(0);
        expect(result.unlockedLevelId).toBeNull();
        expect(state.isLevelUnlocked(2)).toBe(false);
    });

    it("keeps the best stars but still awards coins on a worse run", () => {
        state.recordRaceResult(1, 15, 3);
        const coinsAfterFirst = state.getCoins();
        const result = state.recordRaceResult(1, 8, 1);
        expect(result.newBest).toBe(false);
        expect(result.unlockedLevelId).toBeNull();
        expect(state.getStars(1)).toBe(3);
        expect(state.getCoins()).toBeGreaterThan(coinsAfterFirst);
    });

    it("rejects races on locked or missing levels", () => {
        expect(() => state.recordRaceResult(3, 10, 3)).toThrow();
        expect(() => state.recordRaceResult(99, 10, 3)).toThrow();
    });

    it("buys engine upgrades until maxed out", () => {
        state.addCoins(1000);

        for (let i = 0; i < ENGINE_UPGRADE_PRICES.length; i++) {
        expect(state.buyEngineUpgrade()).toBe(true);
        }

        expect(state.getNextEngineUpgradePrice()).toBeNull();

        const remainingCoins = state.getCoins();

        expect(state.buyEngineUpgrade()).toBe(false);
        expect(state.getCoins()).toBe(remainingCoins);

        expect(car.getSpeedMultiplier()).toBeGreaterThan(1);
    });

    it("buys permanent upgrades only once", () => {
        state.addCoins(100);

        expect(state.buyUpgrade("Speed Boost")).toBe(true);
        expect(state.ownsUpgrade("Speed Boost")).toBe(true);

        const remainingCoins = state.getCoins();

        expect(state.buyUpgrade("Speed Boost")).toBe(false);
        expect(state.getCoins()).toBe(remainingCoins);
    });

    it("caps Shield purchases and saves the count after consumption", () => {
        const price = UPGRADE_PRICES.Shield;
        state.addCoins((MAX_SHIELDS + 1) * price);
        for (let count = 0; count < MAX_SHIELDS; count += 1) {
            expect(state.buyUpgrade("Shield")).toBe(true);
        }

        expect(state.buyUpgrade("Shield")).toBe(false);
        expect(state.getShieldCount()).toBe(MAX_SHIELDS);
        expect(state.getCoins()).toBe(price);
        expect(new GameState(storage).getShieldCount()).toBe(MAX_SHIELDS);

        expect(state.consumeShield()).toBe(true);
        const reloaded = new GameState(storage);
        expect(reloaded.getShieldCount()).toBe(MAX_SHIELDS - 1);
        expect(reloaded.buyUpgrade("Shield")).toBe(true);
        expect(reloaded.getCoins()).toBe(0);
    });

    it("refuses purchases without enough coins", () => {
        expect(state.buyEngineUpgrade()).toBe(false);
        expect(state.buySkin("blue")).toBe(false);
        expect(state.spendCoins(1)).toBe(false);
        expect(state.getCoins()).toBe(0);
    });

    it("buys, equips and switches skins", () => {
        state.addCoins(SKIN_PRICES.green);
        expect(state.buySkin("green")).toBe(true);
        expect(car.getSkin()).toBe("green");
        expect(state.buySkin("green")).toBe(false);
        expect(state.selectSkin("red")).toBe(true);
        expect(state.selectSkin("purple")).toBe(false);
        expect(car.getSkin()).toBe("red");
    });

    it("notifies subscribers until they unsubscribe", () => {
        const listener = vi.fn();
        const unsubscribe = state.subscribe(listener);
        state.addCoins(10);
        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
        state.addCoins(10);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("saves and reloads progress", () => {
        state.recordRaceResult(1, 15, 3);
        state.buySkin("blue");

        state.addCoins(100);
        state.buyUpgrade("Shield");

        const reloaded = new GameState(storage);

        expect(reloaded.toJSON()).toEqual(state.toJSON());
        expect(reloaded.getShieldCount()).toBe(1);
    });

    it("falls back to defaults on a corrupted save", () => {
        storage.setItem(SAVE_KEY, "{not json");
        expect(new GameState(storage).getCoins()).toBe(0);

        storage.setItem(SAVE_KEY, JSON.stringify({ coins: 20, ownedSkins: ["gold"], selectedSkin: "gold" }));
        const loaded = new GameState(storage);
        expect(loaded.getCoins()).toBe(20);
        expect(loaded.getOwnedSkins()).toEqual(["red"]);
        expect(loaded.getCar().getSkin()).toBe("red");
    });

    it("reset wipes progress", () => {
        state.recordRaceResult(1, 15, 3);
        state.reset();
        expect(state.getCoins()).toBe(0);
        expect(state.getTotalStars()).toBe(0);
    });

    it("works without storage", () => {
        const memoryOnly = new GameState(null);
        memoryOnly.addCoins(5);
        expect(memoryOnly.getCoins()).toBe(5);
    });
});
