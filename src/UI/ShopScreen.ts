import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";
import { SKIN_PRICES, ENGINE_UPGRADE_PRICES, UPGRADE_PRICES } from "../Game/gameConfig";
import type { Upgrade } from "../Game/gameConfig"

type ShopTab = "skin" | "engine" | "upgrade";
type ColorId =
  | "red"
  | "blue"
  | "yellow"
  | "green"
  | "purple"
  | "white"
  | "black"
  | "pink";
type UpgradeId = "speed-boost" | "better-tires" | "shield" | "extra-time";

interface CarColor {
  id: ColorId;
  name: string;
  hex: string;
  filter: string;
}

interface UpgradeOption {
  id: UpgradeId;
  name: string;
  description: string;
  price: number;
  imageSrc: string;
}




// Temporary UI values mirror the backend categories until its Shop API is ready.
// const ENGINE_PRICES = [40, 80, 150] as const;

const COLORS: readonly CarColor[] = [
  { id: "red", name: "RACING RED", hex: "#f20f19", filter: "none" },
  {
    id: "blue",
    name: "OCEAN BLUE",
    hex: "#0879ed",
    filter: "hue-rotate(215deg) saturate(1.15)",
  },
  {
    id: "yellow",
    name: "SUNSET GOLD",
    hex: "#ffc20b",
    filter: "hue-rotate(45deg) saturate(1.2) brightness(1.08)",
  },
  {
    id: "green",
    name: "NEON GREEN",
    hex: "#18db38",
    filter: "hue-rotate(105deg) saturate(1.25) brightness(1.06)",
  },
  {
    id: "purple",
    name: "PURPLE RUSH",
    hex: "#9227e8",
    filter: "hue-rotate(275deg) saturate(1.12)",
  },
  {
    id: "white",
    name: "ARCTIC WHITE",
    hex: "#e8edf2",
    filter: "grayscale(1) brightness(2.1) contrast(.72)",
  },
  {
    id: "black",
    name: "MIDNIGHT",
    hex: "#17191e",
    filter: "grayscale(1) brightness(.32) contrast(1.45)",
  },
  {
    id: "pink",
    name: "HOT PINK",
    hex: "#f43c9b",
    filter: "hue-rotate(320deg) saturate(1.25) brightness(1.12)",
  },
];

const UPGRADES: readonly UpgradeOption[] = [
  {
    id: "speed-boost",
    name: "SPEED BOOST",
    description: "A burst of speed after a correct answer.",
    price: 20,
    imageSrc: "/images/shop/upgrades/speed-boost.png",
  },
  {
    id: "better-tires",
    name: "BETTER TIRES",
    description: "Improves acceleration and handling.",
    price: 30,
    imageSrc: "/images/shop/upgrades/better-tires.png",
  },
  {
    id: "shield",
    name: "SHIELD",
    description: "Blocks damage from one wrong answer.",
    price: 25,
    imageSrc: "/images/shop/upgrades/shield.png",
  },
  {
    id: "extra-time",
    name: "EXTRA TIME",
    description: "Adds five seconds to each question.",
    price: 35,
    imageSrc: "/images/shop/upgrades/extra-time.png",
  },
];

const UPGRADE_BY_ID: Record<UpgradeId, Upgrade> = {
  "speed-boost": "Speed Boost",
  "better-tires": "Better Tires",
  shield: "Shield",
  "extra-time": "Extra Time",
};



function isColorId(value: unknown): value is ColorId {
  return (
    typeof value === "string" && COLORS.some((color) => color.id === value)
  );
}

function isUpgradeId(value: unknown): value is UpgradeId {
  return (
    typeof value === "string" &&
    UPGRADES.some((upgrade) => upgrade.id === value)
  );
}



export class ShopScreen implements Scene {
  private readonly game: Game;
  private screen: HTMLElement | null = null;
  private previewColorId: ColorId = "red";
  private pendingColorId: ColorId | null = null;
  private unsubscribeFromGameState: (() => void) | null = null;

  constructor(game: Game) {
    this.game = game;
  }

  enter(_params: SceneParams): void {
    this.previewColorId = this.game.state.getCar().getSkin();
    this.pendingColorId = null;
    const screen = document.createElement("section");
    screen.className = "screen shop-screen";
    screen.id = "shop-screen";
    screen.innerHTML = `
      <img class="shop-background" src="/images/shop/garage-bg.png" alt="" aria-hidden="true">
      <div class="shop-interface">
        <header class="shop-header">
          <button class="shop-back" type="button" data-shop-action="back">← GARAGE</button>
          <div class="shop-brand" aria-label="Shop">
            <span class="shop-checker" aria-hidden="true"></span>
            <h1>SHOP</h1>
            <span class="shop-checker" aria-hidden="true"></span>
          </div>
          <div class="shop-wallet" aria-label="Prototype coin balance">
            <span class="shop-coin-icon" aria-hidden="true"></span><strong data-shop-balance></strong>
          </div>
        </header>

        <nav class="shop-tabs" aria-label="Shop categories">
          <button class="shop-tab active" type="button" data-shop-tab="skin" aria-pressed="true">▰ CAR COLORS</button>
          <button class="shop-tab" type="button" data-shop-tab="engine" aria-pressed="false">⚙ ENGINE</button>
          <button class="shop-tab" type="button" data-shop-tab="upgrade" aria-pressed="false">▲ UPGRADES</button>
        </nav>

        <div class="shop-panel active" data-shop-panel="skin">
          <div class="color-shop-showcase">
            <div class="color-grid" data-color-grid aria-label="Available car colors"></div>
            <aside class="color-showroom" aria-label="Selected car color preview">
              <div class="color-nameplate" data-color-name></div>
              <img class="showroom-platform-image" src="/images/shop/display-platform.png" alt="" aria-hidden="true">
              <img class="showroom-car-image" src="/images/shop/car-red.png" alt="Car color preview" data-preview-car>
            </aside>
          </div>
          <section class="owned-colors" aria-labelledby="owned-colors-title">
            <h2 id="owned-colors-title"><span></span> OWNED COLORS <span></span></h2>
            <div class="owned-color-grid" data-owned-color-grid></div>
          </section>
        </div>

        <div class="shop-panel engine-panel" data-shop-panel="engine" hidden>
          <section class="engine-card" aria-labelledby="engine-title">
            <div class="engine-visual" aria-hidden="true">
              <span class="engine-piston engine-piston-left"></span>
              <span class="engine-core">V8</span>
              <span class="engine-piston engine-piston-right"></span>
            </div>
            <div class="engine-details">
              <p class="shop-eyebrow">PERFORMANCE TUNING</p>
              <h2 id="engine-title">ENGINE LEVEL <span data-engine-level></span></h2>
              <p>Upgrade the engine to increase the car's maximum racing speed.</p>
              <div class="engine-level-track" data-engine-level-track aria-label="Engine upgrade progress"></div>
              <button class="shop-purchase-button" type="button" data-buy-engine></button>
            </div>
          </section>
          <aside class="engine-preview" aria-label="Engine upgrade car preview">
            <img src="/images/shop/display-platform.png" alt="" aria-hidden="true">
            <img src="/images/shop/car-red.png" alt="Car ready for an engine upgrade">
          </aside>
        </div>

        <div class="shop-panel upgrade-panel" data-shop-panel="upgrade" hidden>
          <header class="upgrade-heading">
            <p class="shop-eyebrow">RACE-DAY EQUIPMENT</p>
            <h2>AVAILABLE UPGRADES</h2>
          </header>
          <div class="upgrade-grid" data-upgrade-grid></div>
        </div>

        <p class="shop-message" data-shop-message aria-live="polite"></p>

        <div class="shop-confirm-overlay" data-color-confirm hidden>
          <section class="shop-confirm-card" role="dialog" aria-modal="true"
            aria-labelledby="color-confirm-title" aria-describedby="color-confirm-description">
            <p class="shop-eyebrow">COLOR PREVIEW</p>
            <span class="confirm-color-swatch" data-confirm-color-swatch aria-hidden="true"></span>
            <h2 id="color-confirm-title" data-confirm-color-name></h2>
            <p id="color-confirm-description">Unlock this car color?</p>
            <div class="confirm-price">
              <span class="shop-coin-icon" aria-hidden="true"></span>
              
              <strong data-confirm-price></strong>
            </div>
            <p class="confirm-balance">YOUR BALANCE: <strong data-confirm-balance></strong> COINS</p>
            <div class="confirm-actions">
              <button type="button" class="confirm-cancel" data-confirm-action="cancel">CANCEL</button>
              <button type="button" class="confirm-buy" data-confirm-action="buy">BUY COLOR</button>
            </div>
          </section>
        </div>
      </div>
    `;

    screen
      .querySelector<HTMLButtonElement>('[data-shop-action="back"]')!
      .addEventListener("click", () => this.game.goTo(SceneIds.Home));

    screen
      .querySelectorAll<HTMLButtonElement>("[data-shop-tab]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          this.selectTab(button.dataset.shopTab as ShopTab);
        });
      });

    screen
      .querySelector<HTMLElement>("[data-color-grid]")!
      .addEventListener("click", (event) =>
        this.handleColorClick(event, "data-color-id"),
      );
    screen
      .querySelector<HTMLElement>("[data-owned-color-grid]")!
      .addEventListener("click", (event) =>
        this.handleColorClick(event, "data-owned-color-id"),
      );
    screen
      .querySelector<HTMLButtonElement>("[data-buy-engine]")!
      .addEventListener("click", () => this.buyEngineUpgrade());
    screen
      .querySelector<HTMLElement>("[data-upgrade-grid]")!
      .addEventListener("click", (event) => this.handleUpgradeClick(event));
    screen
      .querySelector<HTMLButtonElement>('[data-confirm-action="cancel"]')!
      .addEventListener("click", () => this.cancelColorPurchase());
    screen
      .querySelector<HTMLButtonElement>('[data-confirm-action="buy"]')!
      .addEventListener("click", () => this.confirmColorPurchase());
    screen.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.pendingColorId)
        this.cancelColorPurchase();
    });

    document.getElementById("game")!.appendChild(screen);
    this.screen = screen;
    this.unsubscribeFromGameState = this.game.state.subscribe(() =>
      this.render(),
    );
    this.render();
  }

  exit(): void {
    this.unsubscribeFromGameState?.();
    this.unsubscribeFromGameState = null;
    this.screen?.remove();
    this.screen = null;
  }

  private selectTab(tabName: ShopTab): void {
    if (!this.screen) return;

    this.screen
      .querySelectorAll<HTMLButtonElement>("[data-shop-tab]")
      .forEach((button) => {
        const isActive = button.dataset.shopTab === tabName;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    this.screen
      .querySelectorAll<HTMLElement>("[data-shop-panel]")
      .forEach((panel) => {
        const isActive = panel.dataset.shopPanel === tabName;
        panel.classList.toggle("active", isActive);
        panel.hidden = !isActive;
      });
    this.setMessage("");
  }

  private handleColorClick(
    event: Event,
    attribute: "data-color-id" | "data-owned-color-id",
  ): void {
    const target = event.target as Element;
    const button = target.closest<HTMLButtonElement>(`[${attribute}]`);
    const colorId =
      attribute === "data-color-id"
        ? button?.dataset.colorId
        : button?.dataset.ownedColorId;
    if (isColorId(colorId)) this.selectColor(colorId);
  }

  private selectColor(colorId: ColorId): void {
    if (this.game.state.ownsSkin(colorId)) {
      
      this.pendingColorId = null;
      this.previewColorId = colorId;
      // this.state.equippedColorId = colorId;
      this.hideColorConfirmation();
      this.game.state.selectSkin(colorId);
      return;
    }

    this.pendingColorId = colorId;
    this.previewColorId = colorId;
    this.render();
    this.showColorConfirmation(colorId);
  }

  private confirmColorPurchase(): void {
    
    const colorId = this.pendingColorId;
    if (!colorId) return;

    // const balance = this.getBalance();
    // if (balance < COLOR_PRICE) {
    //   this.setMessage(`NEED ${COLOR_PRICE - balance} MORE COINS!`);
    //   return;
    // }
    this.previewColorId = colorId;
    this.pendingColorId = null;
    this.hideColorConfirmation();

    if (!this.game.state.buySkin(colorId)) {
      const missing = SKIN_PRICES[colorId] - this.getBalance();
      this.setMessage(
        missing > 0 ? `NEED ${missing} MORE COINS!` : `Can't buy that`,
      );
      return;
    }
    this.setMessage(`${this.getColor(colorId).name} UNLOCKED!`);
  }

  private cancelColorPurchase(): void {
    this.pendingColorId = null;
    this.previewColorId = this.game.state.getCar().getSkin();
    this.hideColorConfirmation();
    this.render();
    this.setMessage("PURCHASE CANCELLED");
  }

  private showColorConfirmation(colorId: ColorId): void {
    if (!this.screen) return;

    const color = this.getColor(colorId);
    const overlay = this.screen.querySelector<HTMLElement>(
      "[data-color-confirm]",
    )!;
    this.screen.querySelector<HTMLElement>(
      "[data-confirm-color-name]",
    )!.textContent = color.name;
    this.screen
      .querySelector<HTMLElement>("[data-confirm-color-swatch]")!
      .style.setProperty("--paint-color", color.hex);
    this.screen.querySelector<HTMLElement>(
      "[data-confirm-balance]",
    )!.textContent = String(this.getBalance());
    overlay.hidden = false;
    this.screen
      .querySelector<HTMLButtonElement>('[data-confirm-action="buy"]')!
      .focus();
    this.screen.querySelector<HTMLElement>(
      "[data-confirm-price]",
    )!.textContent = String(SKIN_PRICES[colorId]);
  }

  private hideColorConfirmation(): void {
    if (this.screen) {
      this.screen.querySelector<HTMLElement>("[data-color-confirm]")!.hidden =
        true;
    }
  }

  private buyEngineUpgrade(): void {
    const price = this.game.state.getNextEngineUpgradePrice();
    if (price === null) {
      this.setMessage("ENGINE IS ALREADY AT MAX LEVEL!");
      return;
    }
    const balance = this.getBalance();
    if (balance < price) {
      this.setMessage(`NEED ${price - balance} MORE COINS!`);
      return;
    }

    if (!this.game.state.buyEngineUpgrade()) return;
    // this.state.engineLevel += 1;
    // this.saveAndRender();
    this.setMessage(`ENGINE UPGRADED TO LEVEL ${this.game.state.getCar().getEngineLevel()}!`);
  }

  private handleUpgradeClick(event: Event): void {
    const target = event.target as Element;
    const button = target.closest<HTMLButtonElement>("[data-upgrade-id]");
    const upgradeId = button?.dataset.upgradeId;
    if (!isUpgradeId(upgradeId)) return;
    const upgrade = this.getUpgrade(upgradeId);
    const gameUpgrade = UPGRADE_BY_ID[upgradeId];

    if (this.game.state.ownsUpgrade(gameUpgrade)) {
      this.setMessage(`${upgrade.name} ALREADY OWNED!`);
      return;
    }

    const price = UPGRADE_PRICES[gameUpgrade];
    const balance = this.getBalance();
    if (balance < upgrade.price) {
      this.setMessage(`NEED ${price - balance} MORE COINS!`);
      return;
    }

    if (!this.game.state.buyUpgrade(gameUpgrade)) return;
    this.setMessage(`${upgrade.name} UNLOCKED!`);
  }

  

  private render(): void {
    if (!this.screen) return;

    const previewColor = this.getColor(this.previewColorId);
    const balance = this.getBalance();
    this.screen.querySelector<HTMLElement>("[data-shop-balance]")!.textContent =
      String(balance);
    if (this.pendingColorId) {
      this.screen.querySelector<HTMLElement>(
        "[data-confirm-balance]",
      )!.textContent = String(balance);
    }
    this.screen.querySelector<HTMLElement>("[data-color-name]")!.textContent =
      previewColor.name;

    const previewCar =
      this.screen.querySelector<HTMLImageElement>("[data-preview-car]")!;
    previewCar.alt = `${previewColor.name} car preview`;
    const paintFilter =
      previewColor.filter === "none" ? "" : `${previewColor.filter} `;
    previewCar.style.filter = `${paintFilter}drop-shadow(0 5px 5px rgba(0, 0, 0, .8))`;

    this.screen.querySelector<HTMLElement>("[data-color-grid]")!.innerHTML =
      COLORS.map((color) => this.colorCardMarkup(color)).join("");
    this.screen.querySelector<HTMLElement>(
      "[data-owned-color-grid]",
    )!.innerHTML = this.game.state
      .getOwnedSkins()
      .map((id) => this.ownedColorMarkup(this.getColor(id)))
      .join("");
    this.renderEnginePanel();
    this.screen.querySelector<HTMLElement>("[data-upgrade-grid]")!.innerHTML =
      UPGRADES.map((upgrade) => this.upgradeCardMarkup(upgrade)).join("");
  }

  private renderEnginePanel(): void {
    if (!this.screen) return;
    const level = this.game.state.getCar().getEngineLevel();
    const price = this.game.state.getNextEngineUpgradePrice();
    const maxLevel= ENGINE_UPGRADE_PRICES.length;

    this.screen.querySelector<HTMLElement>("[data-engine-level]")!.textContent =
      `${level}/${maxLevel}`;
    this.screen.querySelector<HTMLElement>(
      "[data-engine-level-track]",
    )!.innerHTML = ENGINE_UPGRADE_PRICES.map(
      (_, index) =>
        `<span class="${index < level ? "filled" : ""}"></span>`,
    ).join("");

    const button =
      this.screen.querySelector<HTMLButtonElement>("[data-buy-engine]")!;
    button.disabled = price === null;
    button.innerHTML =
      price === null
        ? "MAX LEVEL"
        : `<span class="shop-coin-icon shop-coin-icon--small" aria-hidden="true"></span>${price}`;
  }

  private colorCardMarkup(color: CarColor): string {
    const isOwned = this.game.state.ownsSkin(color.id);
    const isEquipped = this.game.state.getCar().getSkin() === color.id;
    const isPreviewing = this.previewColorId === color.id && !isEquipped;
    const price = SKIN_PRICES[color.id];
    const stateLabel = isEquipped
      ? "EQUIPPED"
      : isOwned
        ? "OWNED"
        : `<span class="shop-coin-icon shop-coin-icon--small" aria-hidden="true"></span>${price}`;

    return `
      <button class="color-card${isEquipped ? " equipped" : ""}${isPreviewing ? " previewing" : ""}${isOwned ? " owned" : " locked"}"
        type="button" data-color-id="${color.id}" aria-pressed="${isEquipped}"
        ${isPreviewing ? 'aria-current="true"' : ""}>
        <span class="paint-swatch" style="--paint-color: ${color.hex}">
          <span class="paint-highlight" aria-hidden="true"></span>
        </span>
        <span class="color-card-name">${color.name}</span>
        <span class="color-card-state">${isOwned ? "" : '<span aria-hidden="true">▣</span>'}${stateLabel}</span>
      </button>`;
  }

  private ownedColorMarkup(color: CarColor): string {
    const isEquipped = this.game.state.getCar().getSkin() === color.id;
    return `
      <button class="owned-color${isEquipped ? " equipped" : ""}"
        type="button" data-owned-color-id="${color.id}" aria-pressed="${isEquipped}">
        <span class="owned-color-swatch" style="--paint-color: ${color.hex}"></span>
        <span class="owned-color-name">${color.name}</span>
        <span class="owned-color-action">${isEquipped ? "EQUIPPED" : "SELECT"}</span>
      </button>`;
  }

  private upgradeCardMarkup(upgrade: UpgradeOption): string {
    const gameUpgrade = UPGRADE_BY_ID[upgrade.id];
    const isOwned = this.game.state.ownsUpgrade(gameUpgrade);
    const price = UPGRADE_PRICES[gameUpgrade];

    return `
      <article class="upgrade-card${isOwned ? " owned" : ""}">
        <div class="upgrade-icon">
          <img src="${upgrade.imageSrc}" alt="" aria-hidden="true" data-upgrade-sticker="${upgrade.id}">
        </div>
        <h3>${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <button class="shop-purchase-button" type="button" data-upgrade-id="${upgrade.id}"
          ${isOwned ? "disabled" : ""}>
          ${
            isOwned
              ? "OWNED"
              : `<span class="shop-coin-icon shop-coin-icon--small" aria-hidden="true"></span>${price}`
          }
        </button>
      </article>`;
  }

  private getColor(colorId: ColorId): CarColor {
    const color = COLORS.find((candidate) => candidate.id === colorId);
    if (!color) throw new Error(`Unknown prototype shop color: ${colorId}`);
    return color;
  }

  private getUpgrade(upgradeId: UpgradeId): UpgradeOption {
    const upgrade = UPGRADES.find((candidate) => candidate.id === upgradeId);
    if (!upgrade)
      throw new Error(`Unknown prototype shop upgrade: ${upgradeId}`);
    return upgrade;
  }

  private getBalance(): number {
    return this.game.state.getCoins();
  }

  private setMessage(message: string): void {
    if (this.screen) {
      this.screen.querySelector<HTMLElement>(
        "[data-shop-message]",
      )!.textContent = message;
    }
  }
}
