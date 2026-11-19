/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { Game } from "../Game/Game.ts";
import { GameState } from "../Game/GameState.ts";
import { SKIN_PRICES } from "../Game/gameConfig.ts";
import { SceneIds } from "../Game/Scene.ts";
import { ShopScreen } from "./ShopScreen.ts";

describe("ShopScreen prototype", () => {
  let game: Game;

  function previewAndConfirmColor(colorId: string): void {
    document.querySelector<HTMLButtonElement>(`[data-color-id="${colorId}"]`)!.click();
    document.querySelector<HTMLButtonElement>('[data-confirm-action="buy"]')!.click();
  }

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<main id="game"></main>';
    game = new Game(new GameState(null));
    game.state.addCoins(75);
    game.register(SceneIds.Shop, (currentGame) => new ShopScreen(currentGame));
  });

  it("renders all colors and the owned inventory", () => {
    game.goTo(SceneIds.Shop);

    expect(document.querySelectorAll("[data-color-id]")).toHaveLength(8);
    // Only red is free
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(1);
    expect(document.querySelector("[data-color-name]")?.textContent).toBe("RACING RED");
  });

  it("matches the backend shop categories without a cosmetics tab", () => {
    game.goTo(SceneIds.Shop);

    expect(Array.from(document.querySelectorAll<HTMLElement>("[data-shop-tab]"))
      .map((tab) => tab.dataset.shopTab)).toEqual(["skin", "engine", "upgrade"]);
    expect(document.querySelector('[data-shop-tab="cosmetics"]')).toBeNull();
  });

  it("shows coins awarded after a completed race and updates while the shop is open", () => {
    const result = game.state.recordRaceResult(1, 15, 3);
    game.goTo(SceneIds.Shop);
    expect(document.querySelector("[data-shop-balance]")?.textContent)
      .toBe(String(75 + result.coinsEarned));

    game.state.addCoins(25);

    expect(document.querySelector("[data-shop-balance]")?.textContent)
      .toBe(String(100 + result.coinsEarned));
  });

  it("equips an owned color", () => {
    game.state.buySkin("blue");
    game.state.selectSkin("red");
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-color-id="blue"]')!.click();

    expect(document.querySelector("[data-color-name]")?.textContent).toBe("OCEAN BLUE");
    expect(document.querySelector('[data-color-id="blue"]')?.classList.contains("equipped")).toBe(true);
  });

  it("equips the color on the car the race uses", () => {
    game.state.buySkin("blue");
    game.state.selectSkin("red");
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-owned-color-id="blue"]')!.click();
    expect(game.state.getCar().getSkin()).toBe("blue");

    document.querySelector<HTMLButtonElement>('[data-owned-color-id="red"]')!.click();
    expect(game.state.getCar().getSkin()).toBe("red");
  });

  it("shows the equipped color when the shop is opened again", () => {
    game.state.buySkin("blue");
    game.goTo(SceneIds.Shop);

    expect(document.querySelector("[data-color-name]")?.textContent).toBe("OCEAN BLUE");
    expect(document.querySelector('[data-color-id="blue"]')?.classList.contains("equipped")).toBe(true);
  });

  it("restores the red preview filter after switching from blue", () => {
    game.state.buySkin("blue");
    game.state.selectSkin("red");
    game.goTo(SceneIds.Shop);
    const previewCar = document.querySelector<HTMLImageElement>("[data-preview-car]")!;

    document.querySelector<HTMLButtonElement>('[data-color-id="blue"]')!.click();
    expect(previewCar.style.filter).toContain("hue-rotate(215deg)");

    document.querySelector<HTMLButtonElement>('[data-color-id="red"]')!.click();

    expect(document.querySelector("[data-color-name]")?.textContent).toBe("RACING RED");
    expect(previewCar.style.filter).not.toContain("hue-rotate");
    expect(previewCar.style.filter).toContain("drop-shadow");
    expect(document.querySelector('[data-color-id="red"]')?.classList.contains("equipped")).toBe(true);
  });

  it("previews a locked color before confirming its purchase", () => {
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-color-id="green"]')!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe("75");
    expect(document.querySelector("[data-color-name]")?.textContent).toBe("NEON GREEN");
    expect(document.querySelector<HTMLElement>("[data-color-confirm]")?.hidden).toBe(false);
    expect(document.querySelector("[data-confirm-color-name]")?.textContent).toBe("NEON GREEN");
    expect(document.querySelector("[data-confirm-price]")?.textContent).toBe(String(SKIN_PRICES.green));
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(1);

    document.querySelector<HTMLButtonElement>('[data-confirm-action="buy"]')!.click();

    const left = String(75 - SKIN_PRICES.green);
    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe(left);
    expect(game.state.getCoins()).toBe(75 - SKIN_PRICES.green);
    expect(game.state.ownsSkin("green")).toBe(true);
    expect(game.state.getCar().getSkin()).toBe("green");
    expect(document.querySelector(".shop-wallet")?.getAttribute("aria-label")).toBe("Prototype coin balance");
    expect(document.querySelector("[data-color-name]")?.textContent).toBe("NEON GREEN");
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(2);
  });

  it("cancels a color purchase without spending coins", () => {
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-color-id="green"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-confirm-action="cancel"]')!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe("75");
    expect(document.querySelector("[data-color-name]")?.textContent).toBe("RACING RED");
    expect(document.querySelector<HTMLElement>("[data-color-confirm]")?.hidden).toBe(true);
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(1);
    expect(game.state.getCar().getSkin()).toBe("red");
  });

  it("uses coin pricing and coin-specific insufficient balance feedback", () => {
    game.goTo(SceneIds.Shop);

    expect(document.querySelector('[data-color-id="green"] .shop-coin-icon')).not.toBeNull();
    expect(document.querySelector('[data-color-id="purple"]')?.textContent).toContain(String(SKIN_PRICES.purple));
    previewAndConfirmColor("green");
    previewAndConfirmColor("purple");

    const left = 75 - SKIN_PRICES.green;
    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe(String(left));
    expect(document.querySelector("[data-shop-message]")?.textContent)
      .toBe(`NEED ${SKIN_PRICES.purple - left} MORE COINS!`);
    expect(game.state.ownsSkin("purple")).toBe(false);
  });

  it("purchases a prototype engine level with coins", () => {
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-shop-tab="engine"]')!.click();
    document.querySelector<HTMLButtonElement>("[data-buy-engine]")!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe("35");
    expect(document.querySelector("[data-engine-level]")?.textContent).toBe("1/3");
  });

  it("purchases a prototype upgrade with coins", () => {
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-shop-tab="upgrade"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-upgrade-id="speed-boost"]')!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe("55");
    expect(document.querySelector('[data-upgrade-id="speed-boost"]')?.textContent).toContain("OWNED");
  });

  it("renders the corresponding sticker for every upgrade", () => {
    game.goTo(SceneIds.Shop);

    const stickers = Array.from(document.querySelectorAll<HTMLImageElement>("[data-upgrade-sticker]"));
    expect(stickers.map((sticker) => [sticker.dataset.upgradeSticker, sticker.getAttribute("src")])).toEqual([
      ["speed-boost", "/images/shop/upgrades/speed-boost.png"],
      ["better-tires", "/images/shop/upgrades/better-tires.png"],
      ["shield", "/images/shop/upgrades/shield.png"],
      ["extra-time", "/images/shop/upgrades/extra-time.png"],
    ]);
  });
});
