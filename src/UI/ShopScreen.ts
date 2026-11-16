import type { Game } from "../Game/Game.ts";
import { SceneIds } from "../Game/Scene.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";

type ShopTab = "colors" | "upgrades" | "cosmetics";
type ColorId =
  | "red"
  | "blue"
  | "yellow"
  | "green"
  | "purple"
  | "white"
  | "black"
  | "pink";

interface CarColor {
  id: ColorId;
  name: string;
  hex: string;
  filter: string;
}

interface PrototypeShopState {
  coins: number;
  equippedColorId: ColorId;
  ownedColorIds: ColorId[];
}

type StoredPrototypeShopState = Partial<PrototypeShopState> & {
  /** Temporary migration support for the earlier star-based UI prototype. */
  stars?: unknown;
};

const COLOR_PRICE = 25;
const STORAGE_KEY = "mathRacer.prototypeShop";

const COLORS: readonly CarColor[] = [
  { id: "red", name: "RACING RED", hex: "#f20f19", filter: "none" },
  { id: "blue", name: "OCEAN BLUE", hex: "#0879ed", filter: "hue-rotate(215deg) saturate(1.15)" },
  { id: "yellow", name: "SUNSET GOLD", hex: "#ffc20b", filter: "hue-rotate(45deg) saturate(1.2) brightness(1.08)" },
  { id: "green", name: "NEON GREEN", hex: "#18db38", filter: "hue-rotate(105deg) saturate(1.25) brightness(1.06)" },
  { id: "purple", name: "PURPLE RUSH", hex: "#9227e8", filter: "hue-rotate(275deg) saturate(1.12)" },
  { id: "white", name: "ARCTIC WHITE", hex: "#e8edf2", filter: "grayscale(1) brightness(2.1) contrast(.72)" },
  { id: "black", name: "MIDNIGHT", hex: "#17191e", filter: "grayscale(1) brightness(.32) contrast(1.45)" },
  { id: "pink", name: "HOT PINK", hex: "#f43c9b", filter: "hue-rotate(320deg) saturate(1.25) brightness(1.12)" },
];

const DEFAULT_STATE: PrototypeShopState = {
  coins: 75,
  equippedColorId: "red",
  ownedColorIds: ["red", "blue", "yellow"],
};

function isColorId(value: unknown): value is ColorId {
  return typeof value === "string" && COLORS.some((color) => color.id === value);
}

function freshDefaultState(): PrototypeShopState {
  return { ...DEFAULT_STATE, ownedColorIds: [...DEFAULT_STATE.ownedColorIds] };
}

function loadState(): PrototypeShopState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshDefaultState();

    const parsed = JSON.parse(raw) as StoredPrototypeShopState;
    const ownedColorIds = Array.isArray(parsed.ownedColorIds)
      ? parsed.ownedColorIds.filter(isColorId)
      : [...DEFAULT_STATE.ownedColorIds];
    const equippedColorId = isColorId(parsed.equippedColorId)
      ? parsed.equippedColorId
      : DEFAULT_STATE.equippedColorId;

    if (!ownedColorIds.includes(equippedColorId)) {
      ownedColorIds.push(equippedColorId);
    }

    const storedCoins = typeof parsed.coins === "number"
      ? parsed.coins
      : typeof parsed.stars === "number"
        ? parsed.stars
        : DEFAULT_STATE.coins;

    return {
      coins: Math.max(0, storedCoins),
      equippedColorId,
      ownedColorIds,
    };
  } catch {
    return freshDefaultState();
  }
}

export class ShopScreen implements Scene {
  private readonly game: Game;
  private screen: HTMLElement | null = null;
  private state: PrototypeShopState = loadState();

  constructor(game: Game) {
    this.game = game;
  }

  enter(_params: SceneParams): void {
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
          <button class="shop-tab active" type="button" data-shop-tab="colors" aria-pressed="true">▰ CAR COLORS</button>
          <button class="shop-tab" type="button" data-shop-tab="upgrades" aria-pressed="false">⚙ UPGRADES</button>
          <button class="shop-tab" type="button" data-shop-tab="cosmetics" aria-pressed="false">◆ COSMETICS</button>
        </nav>

        <div class="shop-panel active" data-shop-panel="colors">
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

        <div class="shop-panel shop-placeholder" data-shop-panel="upgrades" hidden>
          <p>UPGRADES WILL CONNECT TO THE SHOP BACKEND LATER</p>
        </div>
        <div class="shop-panel shop-placeholder" data-shop-panel="cosmetics" hidden>
          <p>COSMETICS COMING SOON</p>
        </div>

        <p class="shop-message" data-shop-message aria-live="polite"></p>
      </div>
    `;

    screen.querySelector<HTMLButtonElement>('[data-shop-action="back"]')!
      .addEventListener("click", () => this.game.goTo(SceneIds.Home));

    screen.querySelectorAll<HTMLButtonElement>("[data-shop-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        this.selectTab(button.dataset.shopTab as ShopTab);
      });
    });

    screen.querySelector<HTMLElement>("[data-color-grid]")!
      .addEventListener("click", (event) => this.handleColorClick(event, "data-color-id"));
    screen.querySelector<HTMLElement>("[data-owned-color-grid]")!
      .addEventListener("click", (event) => this.handleColorClick(event, "data-owned-color-id"));

    document.getElementById("game")!.appendChild(screen);
    this.screen = screen;
    this.render();
  }

  exit(): void {
    this.screen?.remove();
    this.screen = null;
  }

  private selectTab(tabName: ShopTab): void {
    if (!this.screen) return;

    this.screen.querySelectorAll<HTMLButtonElement>("[data-shop-tab]").forEach((button) => {
      const isActive = button.dataset.shopTab === tabName;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    this.screen.querySelectorAll<HTMLElement>("[data-shop-panel]").forEach((panel) => {
      const isActive = panel.dataset.shopPanel === tabName;
      panel.classList.toggle("active", isActive);
      panel.hidden = !isActive;
    });
    this.setMessage("");
  }

  private handleColorClick(event: Event, attribute: "data-color-id" | "data-owned-color-id"): void {
    const target = event.target as Element;
    const button = target.closest<HTMLButtonElement>(`[${attribute}]`);
    const colorId = attribute === "data-color-id"
      ? button?.dataset.colorId
      : button?.dataset.ownedColorId;
    if (isColorId(colorId)) this.selectColor(colorId);
  }

  private selectColor(colorId: ColorId): void {
    if (this.state.ownedColorIds.includes(colorId)) {
      this.state.equippedColorId = colorId;
      this.saveAndRender();
      return;
    }

    if (this.state.coins < COLOR_PRICE) {
      this.setMessage(`NEED ${COLOR_PRICE - this.state.coins} MORE COINS!`);
      return;
    }

    this.state.coins -= COLOR_PRICE;
    this.state.ownedColorIds.push(colorId);
    this.state.equippedColorId = colorId;
    this.saveAndRender();
    this.setMessage(`${this.getColor(colorId).name} UNLOCKED!`);
  }

  private saveAndRender(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // The prototype still works in memory if browser storage is unavailable.
    }
    this.render();
  }

  private render(): void {
    if (!this.screen) return;

    const equippedColor = this.getColor(this.state.equippedColorId);
    this.screen.querySelector<HTMLElement>("[data-shop-balance]")!.textContent = String(this.state.coins);
    this.screen.querySelector<HTMLElement>("[data-color-name]")!.textContent = equippedColor.name;

    const previewCar = this.screen.querySelector<HTMLImageElement>("[data-preview-car]")!;
    previewCar.alt = `${equippedColor.name} car preview`;
    previewCar.style.filter = `${equippedColor.filter} drop-shadow(0 5px 5px rgba(0, 0, 0, .8))`;

    this.screen.querySelector<HTMLElement>("[data-color-grid]")!.innerHTML = COLORS
      .map((color) => this.colorCardMarkup(color))
      .join("");
    this.screen.querySelector<HTMLElement>("[data-owned-color-grid]")!.innerHTML = this.state.ownedColorIds
      .map((id) => this.ownedColorMarkup(this.getColor(id)))
      .join("");
  }

  private colorCardMarkup(color: CarColor): string {
    const isOwned = this.state.ownedColorIds.includes(color.id);
    const isEquipped = this.state.equippedColorId === color.id;
    const stateLabel = isEquipped
      ? "EQUIPPED"
      : isOwned
        ? "OWNED"
        : `<span class="shop-coin-icon shop-coin-icon--small" aria-hidden="true"></span>${COLOR_PRICE}`;

    return `
      <button class="color-card${isEquipped ? " equipped" : ""}${isOwned ? " owned" : " locked"}"
        type="button" data-color-id="${color.id}" aria-pressed="${isEquipped}">
        <span class="paint-swatch" style="--paint-color: ${color.hex}">
          <span class="paint-highlight" aria-hidden="true"></span>
        </span>
        <span class="color-card-name">${color.name}</span>
        <span class="color-card-state">${isOwned ? "" : '<span aria-hidden="true">▣</span>'}${stateLabel}</span>
      </button>`;
  }

  private ownedColorMarkup(color: CarColor): string {
    const isEquipped = this.state.equippedColorId === color.id;
    return `
      <button class="owned-color${isEquipped ? " equipped" : ""}"
        type="button" data-owned-color-id="${color.id}" aria-pressed="${isEquipped}">
        <span class="owned-color-swatch" style="--paint-color: ${color.hex}"></span>
        <span class="owned-color-name">${color.name}</span>
        <span class="owned-color-action">${isEquipped ? "EQUIPPED" : "SELECT"}</span>
      </button>`;
  }

  private getColor(colorId: ColorId): CarColor {
    const color = COLORS.find((candidate) => candidate.id === colorId);
    if (!color) throw new Error(`Unknown prototype shop color: ${colorId}`);
    return color;
  }

  private setMessage(message: string): void {
    if (this.screen) {
      this.screen.querySelector<HTMLElement>("[data-shop-message]")!.textContent = message;
    }
  }
}
