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

  it("equips an owned color", () => {
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-color-id="blue"]')!.click();

    expect(document.querySelector("[data-color-name]")?.textContent).toBe("OCEAN BLUE");
    expect(document.querySelector('[data-color-id="blue"]')?.classList.contains("equipped")).toBe(true);
  });

  it("purchases a locked color with prototype coins", () => {
    game.goTo(SceneIds.Shop);

    document.querySelector<HTMLButtonElement>('[data-color-id="green"]')!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe("50");
    expect(document.querySelector(".shop-wallet")?.getAttribute("aria-label")).toBe("Prototype coin balance");
    expect(document.querySelector("[data-color-name]")?.textContent).toBe("NEON GREEN");
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(4);
  });

  it("uses coin pricing and coin-specific insufficient balance feedback", () => {
    game.goTo(SceneIds.Shop);

    expect(document.querySelector('[data-color-id="green"] .shop-coin-icon')).not.toBeNull();
    document.querySelector<HTMLButtonElement>('[data-color-id="green"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-color-id="purple"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-color-id="white"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-color-id="black"]')!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe("0");
    expect(document.querySelector("[data-shop-message]")?.textContent).toBe("NEED 25 MORE COINS!");
  });
});
