/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Game } from "../Game/Game.ts";
import { GameState } from "../Game/GameState.ts";
import { SceneIds } from "../Game/Scene.ts";
import { ShopScreen } from "./ShopScreen.ts";
import { MAX_SHIELDS, SKIN_PRICES, UPGRADE_PRICES } from "../Game/gameConfig.ts";
import { Shop } from "../shop/shop.ts";

describe("ShopScreen prototype", () => {
  let game: Game;

  function previewAndConfirmColor(colorId: string): void {
    document
      .querySelector<HTMLButtonElement>(`[data-color-id="${colorId}"]`)!
      .click();
    document
      .querySelector<HTMLButtonElement>('[data-confirm-action="buy"]')!
      .click();
  }

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<main id="game"></main>';
    game = new Game(new GameState(null));
    game.state.addCoins(75);
    game.register(SceneIds.Shop, (currentGame) => new ShopScreen(currentGame));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all colors and the owned inventory", () => {
    game.goTo(SceneIds.Shop);

    expect(Array.from(document.querySelectorAll<HTMLElement>("[data-color-id]"),
      (card) => card.dataset.colorId)).toEqual([
        "red", "blue", "yellow", "green", "purple", "white", "black", "pink",
      ]);
    expect([...document.querySelectorAll<HTMLElement>("[data-owned-color-id]")]
      .map((card) => card.dataset.ownedColorId)).toEqual(["red"]);
    expect(Array.from(document.querySelectorAll(".color-card.locked .color-card-state"),
      (badge) => badge.textContent?.trim())).toEqual([
        "▣75", "▣75", "▣75", "▣75", "▣75", "▣100", "▣100",
      ]);
    expect(document.querySelector("[data-color-name]")?.textContent).toBe(
      "RACING RED",
    );
    expect(document.querySelector("[data-upgrade-stock]")?.textContent)
      .toBe(`0/${MAX_SHIELDS} OWNED`);
  });

  it("keeps an owned premium paint in its original price tier", () => {
    game.state.addCoins(25);
    game.goTo(SceneIds.Shop);

    previewAndConfirmColor("black");

    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-color-id]"));
    expect(cards.slice(-2).map((card) => card.dataset.colorId)).toEqual(["black", "pink"]);
    expect(cards.at(-2)?.querySelector(".color-card-state")?.textContent).toBe("EQUIPPED");
    expect(game.state.getCoins()).toBe(0);
  });

  it("shows only Car Colors and Upgrades in the shop", () => {
    game.goTo(SceneIds.Shop);

    expect(Array.from(document.querySelectorAll<HTMLElement>("[data-shop-tab]"))
      .map((tab) => tab.dataset.shopTab)).toEqual(["skin", "upgrade"]);
    expect(Array.from(document.querySelectorAll<HTMLElement>("[data-shop-panel]"))
      .map((panel) => panel.dataset.shopPanel)).toEqual(["skin", "upgrade"]);
  });

  it("shows coins awarded after a completed race and updates while the shop is open", () => {
    const result = game.state.recordRaceResult(1, 15, 3);
    game.goTo(SceneIds.Shop);
    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe(
      String(75 + result.coinsEarned),
    );

    game.state.addCoins(25);

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe(
      String(100 + result.coinsEarned),
    );
  });

  it("equips an owned color", () => {
    game.state.buySkin("blue");
    game.state.selectSkin("red");
    game.goTo(SceneIds.Shop);

    document
      .querySelector<HTMLButtonElement>('[data-color-id="blue"]')!
      .click();

    expect(document.querySelector("[data-color-name]")?.textContent).toBe(
      "OCEAN BLUE",
    );
    expect(
      document
        .querySelector('[data-color-id="blue"]')
        ?.classList.contains("equipped"),
    ).toBe(true);
  });

  it("restores the red preview filter after switching from blue", () => {
    game.state.buySkin("blue");
    game.state.selectSkin("red");
    game.goTo(SceneIds.Shop);
    const previewCar =
      document.querySelector<HTMLImageElement>("[data-preview-car]")!;

    document
      .querySelector<HTMLButtonElement>('[data-color-id="blue"]')!
      .click();
    expect(previewCar.style.filter).toContain("hue-rotate(215deg)");

    document.querySelector<HTMLButtonElement>('[data-color-id="red"]')!.click();

    expect(document.querySelector("[data-color-name]")?.textContent).toBe(
      "RACING RED",
    );
    expect(previewCar.style.filter).not.toContain("hue-rotate");
    expect(previewCar.style.filter).toContain("drop-shadow");
    expect(
      document
        .querySelector('[data-color-id="red"]')
        ?.classList.contains("equipped"),
    ).toBe(true);
  });

  it("previews a locked color before confirming its purchase", () => {
    game.goTo(SceneIds.Shop);

    document
      .querySelector<HTMLButtonElement>('[data-color-id="green"]')!
      .click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe(
      "75",
    );
    expect(document.querySelector("[data-color-name]")?.textContent).toBe(
      "NEON GREEN",
    );
    expect(
      document.querySelector<HTMLElement>("[data-color-confirm]")?.hidden,
    ).toBe(false);
    expect(
      document.querySelector("[data-confirm-color-name]")?.textContent,
    ).toBe("NEON GREEN");
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(1);

    document
      .querySelector<HTMLButtonElement>('[data-confirm-action="buy"]')!
      .click();
    const remaining = 75 - SKIN_PRICES.green;
    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe(
      String(remaining),
    );
    expect(game.state.getCoins()).toBe(remaining);
    expect(
      document.querySelector(".shop-wallet")?.getAttribute("aria-label"),
    ).toBe("Prototype coin balance");
    expect(document.querySelector("[data-color-name]")?.textContent).toBe(
      "NEON GREEN",
    );
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(2);
  });

  it("cancels a color purchase without spending coins", () => {
    game.goTo(SceneIds.Shop);

    document
      .querySelector<HTMLButtonElement>('[data-color-id="green"]')!
      .click();
    document
      .querySelector<HTMLButtonElement>('[data-confirm-action="cancel"]')!
      .click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe(
      "75",
    );
    expect(document.querySelector("[data-color-name]")?.textContent).toBe(
      "RACING RED",
    );
    expect(
      document.querySelector<HTMLElement>("[data-color-confirm]")?.hidden,
    ).toBe(true);
    expect(document.querySelectorAll("[data-owned-color-id]")).toHaveLength(1);
  });

  it("uses coin pricing and coin-specific insufficient balance feedback", () => {
    const short = 10;
    const coinsLeft = SKIN_PRICES.green - short;
    game.state.spendCoins(game.state.getCoins() - coinsLeft);
    game.goTo(SceneIds.Shop);

    expect(
      document.querySelector('[data-color-id="green"] .shop-coin-icon'),
    ).not.toBeNull();
    previewAndConfirmColor("green");
    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe(
      String(coinsLeft),
    );
    expect(document.querySelector("[data-shop-message]")?.textContent).toBe(
      `NEED ${short} MORE COINS!`,
    );
    expect(game.state.ownsSkin("green")).toBe(false);
  });

  it.each([
    ["speed-boost", "Speed Boost"],
    ["better-tires", "Better Tires"],
    ["extra-time", "Extra Time"],
  ] as const)("marks %s as owned after a single purchase", (id, upgrade) => {
    const balance = 150;
    game.state.addCoins(balance - game.state.getCoins());
    game.goTo(SceneIds.Shop);

    document
      .querySelector<HTMLButtonElement>('[data-shop-tab="upgrade"]')!
      .click();
    const purchaseButton = `[data-upgrade-id="${id}"]`;
    document.querySelector<HTMLButtonElement>(purchaseButton)!.click();

    expect(document.querySelector("[data-shop-balance]")?.textContent).toBe(
      String(balance - UPGRADE_PRICES[upgrade]),
    );
    const ownedButton = document.querySelector<HTMLButtonElement>(purchaseButton)!;
    expect(ownedButton.textContent).toContain("OWNED");
    expect(ownedButton.disabled).toBe(true);
  });

  it("uses the configured upgrade price for both the label and affordability", () => {
    const originalPrice = UPGRADE_PRICES["Speed Boost"];
    const purchase = vi.spyOn(Shop.prototype, "purchase");
    UPGRADE_PRICES["Speed Boost"] = 10;
    try {
      game.state.spendCoins(65);
      game.goTo(SceneIds.Shop);
      document.querySelector<HTMLButtonElement>('[data-shop-tab="upgrade"]')!.click();
      const button = document.querySelector<HTMLButtonElement>('[data-upgrade-id="speed-boost"]')!;

      expect(button.textContent?.trim()).toBe("10");
      button.click();

      expect(purchase).toHaveBeenCalledWith("upgrade:Speed Boost");
      expect(game.state.ownsUpgrade("Speed Boost")).toBe(true);
      expect(game.state.getCoins()).toBe(0);
    } finally {
      UPGRADE_PRICES["Speed Boost"] = originalPrice;
    }
  });

  it("keeps Shield purchasable until inventory reaches the cap", () => {
    const price = UPGRADE_PRICES.Shield;
    game.state.addCoins((MAX_SHIELDS + 1) * price - game.state.getCoins());
    for (let count = 0; count < MAX_SHIELDS - 2; count += 1) {
      game.state.buyUpgrade("Shield");
    }
    game.goTo(SceneIds.Shop);
    document.querySelector<HTMLButtonElement>('[data-shop-tab="upgrade"]')!.click();
    const shieldButton = () => document.querySelector<HTMLButtonElement>('[data-upgrade-id="shield"]')!;

    expect(shieldButton().textContent?.trim()).toBe(String(price));
    shieldButton().click();
    expect(shieldButton().disabled).toBe(false);
    expect(document.querySelector("[data-upgrade-stock]")?.textContent)
      .toBe(`${MAX_SHIELDS - 1}/${MAX_SHIELDS} OWNED`);
    shieldButton().click();
    expect(document.querySelector("[data-upgrade-stock]")?.textContent)
      .toBe(`${MAX_SHIELDS}/${MAX_SHIELDS} OWNED`);
    expect(shieldButton().textContent?.trim()).toBe("LIMIT REACHED");
    expect(shieldButton().disabled).toBe(true);
    expect(game.state.getCoins()).toBe(price);
  });

  it("takes card prices, confirmation prices, and affordability from the Shop catalog", () => {
    const getCatalog = Shop.prototype.getCatalog;
    let greenPrice = 61;
    vi.spyOn(Shop.prototype, "getCatalog").mockImplementation(function (this: Shop) {
      const prices: Record<string, number> = { "skin:green": greenPrice, "upgrade:Speed Boost": 90 };
      return getCatalog.call(this).map((item) => {
        const price = prices[item.id];
        return price === undefined ? item : { ...item, price, affordable: price <= this.getBalance() };
      });
    });
    const purchase = vi.spyOn(Shop.prototype, "purchase");
    game.goTo(SceneIds.Shop);

    const green = document.querySelector<HTMLButtonElement>('[data-color-id="green"]')!;
    expect(document.querySelector("[data-color-id]")).toBe(green);
    expect(green.querySelector(".color-card-state")?.textContent?.trim()).toBe("▣61");
    green.click();
    expect(document.querySelector("[data-confirm-price]")?.textContent).toBe("61");

    greenPrice = 66;
    game.state.addCoins(1);
    expect(document.querySelector("[data-confirm-price]")?.textContent).toBe("66");
    document.querySelector<HTMLButtonElement>('[data-confirm-action="cancel"]')!.click();

    document.querySelector<HTMLButtonElement>('[data-shop-tab="upgrade"]')!.click();
    const boost = document.querySelector<HTMLButtonElement>('[data-upgrade-id="speed-boost"]')!;
    expect(boost.textContent?.trim()).toBe("90");
    boost.click();
    expect(document.querySelector("[data-shop-message]")?.textContent).toBe("NEED 14 MORE COINS!");
    expect(purchase).not.toHaveBeenCalled();
  });

  it("renders the corresponding sticker for every upgrade", () => {
    game.goTo(SceneIds.Shop);

    const stickers = Array.from(
      document.querySelectorAll<HTMLImageElement>("[data-upgrade-sticker]"),
    );
    expect(
      stickers.map((sticker) => [
        sticker.dataset.upgradeSticker,
        sticker.getAttribute("src"),
      ]),
    ).toEqual([
      ["speed-boost", "/images/shop/upgrades/speed-boost.png"],
      ["better-tires", "/images/shop/upgrades/better-tires.png"],
      ["shield", "/images/shop/upgrades/shield.png"],
      ["extra-time", "/images/shop/upgrades/extra-time.png"],
    ]);
  });
});
