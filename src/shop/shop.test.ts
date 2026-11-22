import { describe, it, expect, beforeEach } from "vitest";

import { Shop } from "./shop";
import { GameState } from "../Game/GameState";

import {
    ENGINE_UPGRADE_PRICES,
    SKIN_PRICES,
    UPGRADE_PRICES,
} from "../Game/gameConfig";

import type { SkinColor, Upgrade } from "../Game/gameConfig";

describe("Shop", () => {
    let game: GameState;
    let shop: Shop;

    beforeEach(() => {
   
    game = new GameState(null);
    shop = new Shop(game);
    });

    describe("getBalance()", () => {
        it("should return the player's current coins", () => {
            game.addCoins(100);

            expect(shop.getBalance()).toBe(100);
        });
    });

    describe("getCatalog()", () => {
        it("should return all items in the shop", () => {
            const items = shop.getCatalog();

            // 1 engine + 8 skins + 4 upgrades
            expect(items).toHaveLength(13);
        });

        it("should include the engine upgrade", () => {
            const items = shop.getCatalog();

            expect(items).toContainEqual(
            expect.objectContaining({
                id: "engine",
                name: "Engine Upgrade",
                category: "engine",
            }),
            );
        });

        it("should include all available skins", () => {
            const items = shop.getCatalog();

            const skins: SkinColor[] = ["red", "blue", "green", "purple"];

            for (const skin of skins) {
            expect(items).toContainEqual(
                expect.objectContaining({
                id: `skin:${skin}`,
                category: "skin",
                }),
            );
            }
        });

        it("should include all available upgrades", () => {
            const items = shop.getCatalog();

            const upgrades: Upgrade[] = [
            "Speed Boost",
            "Better Tires",
            "Shield",
            "Extra Time",
            ];

            for (const upgrade of upgrades) {
            expect(items).toContainEqual(
                expect.objectContaining({
                id: `upgrade:${upgrade}`,
                category: "upgrade",
                }),
            );
            }
        });

        it("should show an owned skin as already purchased", () => {
            const items = shop.getCatalog();

            const redSkin = items.find((item) => item.id === "skin:red");

            expect(redSkin?.owned).toBe(true);
            expect(redSkin?.price).toBeNull();
        });

        it("should show whether an item is affordable", () => {
            let items = shop.getCatalog();

            let greenSkin = items.find((item) => item.id === "skin:green");

            expect(greenSkin?.affordable).toBe(false);

            game.addCoins(SKIN_PRICES.green);

            items = shop.getCatalog();

            greenSkin = items.find((item) => item.id === "skin:green");

            expect(greenSkin?.affordable).toBe(true);
        });
    });

        describe("purchase()", () => {
        it("should purchase an engine upgrade", () => {
            const initialLevel = game.getCar().getEngineLevel();
            const price = ENGINE_UPGRADE_PRICES[initialLevel];

            if (price === undefined) {
            throw new Error("No engine upgrade available");
            }

            game.addCoins(price);

            const result = shop.purchase("engine");

            expect(result).toBe(true);
            expect(game.getCar().getEngineLevel()).toBe(initialLevel + 1);
            expect(game.getCoins()).toBe(0);
        });

        it("should purchase a skin", () => {
            const price = SKIN_PRICES.green;

            game.addCoins(price);

            const result = shop.purchase("skin:green");

            expect(result).toBe(true);
            expect(game.ownsSkin("green")).toBe(true);
            expect(game.getCoins()).toBe(0);
        });

        it("should purchase an upgrade", () => {
            const price = UPGRADE_PRICES.Shield;

            game.addCoins(price);

            const result = shop.purchase("upgrade:Shield");

            expect(result).toBe(true);
            expect(game.ownsUpgrade("Shield")).toBe(true);
            expect(game.getCoins()).toBe(0);
        });

        it("should not purchase an item if the player cannot afford it", () => {
            const result = shop.purchase("skin:green");

            expect(result).toBe(false);
            expect(game.ownsSkin("green")).toBe(false);
            expect(game.getCoins()).toBe(0);
        });

        it("should not purchase a skin that the player already owns", () => {
            game.addCoins(100);

            // Red is already owned by default.
            const result = shop.purchase("skin:red");

            expect(result).toBe(false);
            expect(game.getCoins()).toBe(100);
        });

        it("should not purchase an upgrade that the player already owns", () => {
            game.addCoins(UPGRADE_PRICES.Shield);

            // Purchase once.
            const firstPurchase = shop.purchase("upgrade:Shield");

            expect(firstPurchase).toBe(true);

            const remainingCoins = game.getCoins();

            // Try to purchase it again.
            const secondPurchase = shop.purchase("upgrade:Shield");

            expect(secondPurchase).toBe(false);
            expect(game.getCoins()).toBe(remainingCoins);
        });

        it("should not purchase an invalid item ID", () => {
            game.addCoins(1000);

            const result = shop.purchase("invalid:item");

            expect(result).toBe(false);
            expect(game.getCoins()).toBe(1000);
        });

        it("should not purchase an invalid skin", () => {
            game.addCoins(1000);

            const result = shop.purchase("skin:orange");

            expect(result).toBe(false);
            expect(game.getCoins()).toBe(1000);
        });

        it("should not purchase an invalid upgrade", () => {
            game.addCoins(1000);

            const result = shop.purchase("upgrade:SuperPower");

            expect(result).toBe(false);
            expect(game.getCoins()).toBe(1000);
        });
    });
});
