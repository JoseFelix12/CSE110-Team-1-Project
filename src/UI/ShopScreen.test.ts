/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from "vitest";
import { Game } from "../Game/Game.ts";
import { GameState } from "../Game/GameState.ts";
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
    game.register(SceneIds.Shop, (currentGame) => new ShopScreen(currentGame));
  });

  it("renders all colors and the owned inventory", () => {
    game.goTo(SceneIds.Shop);

    expect(document.querySelectorAll("[data-color-id]")).toHaveLength(8);
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(3);
    expect(document.querySelector("[data-color-name]")?.textContent).toBe("RACING RED");
  });

  it("matches the backend shop categories without a cosmetics tab", () => {
    game.goTo(SceneIds.Shop);

    expect(Array.from(document.querySelectorAll<HTMLElement>("[data-shop-tab]"))
      .map((tab) => tab.dataset.shopTab)).toEqual(["skin", "engine", "upgrade"]);
    expect(document.querySelector('[data-shop-tab="cosmetics"]')).toBeNull();
  });

  it("equips an owned color", () => {
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-color-id="blue"]')!.click();

    expect(document.querySelector("[data-color-name]")?.textContent).toBe("OCEAN BLUE");
    expect(document.querySelector('[data-color-id="blue"]')?.classList.contains("equipped")).toBe(true);
  });

  it("restores the red preview filter after switching from blue", () => {
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
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(3);

    document.querySelector<HTMLButtonElement>('[data-confirm-action="buy"]')!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe("50");
    expect(document.querySelector(".shop-wallet")?.getAttribute("aria-label")).toBe("Prototype coin balance");
    expect(document.querySelector("[data-color-name]")?.textContent).toBe("NEON GREEN");
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(4);
  });

  it("cancels a color purchase without spending coins", () => {
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-color-id="green"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-confirm-action="cancel"]')!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe("75");
    expect(document.querySelector("[data-color-name]")?.textContent).toBe("RACING RED");
    expect(document.querySelector<HTMLElement>("[data-color-confirm]")?.hidden).toBe(true);
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(3);
  });

  it("uses coin pricing and coin-specific insufficient balance feedback", () => {
    game.goTo(SceneIds.Shop);

    expect(document.querySelector('[data-color-id="green"] .shop-coin-icon')).not.toBeNull();
    previewAndConfirmColor("green");
    previewAndConfirmColor("purple");
    previewAndConfirmColor("white");
    document.querySelector<HTMLButtonElement>('[data-color-id="black"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-confirm-action="buy"]')!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe("0");
    expect(document.querySelector("[data-shop-message]")?.textContent).toBe("NEED 25 MORE COINS!");
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
});
