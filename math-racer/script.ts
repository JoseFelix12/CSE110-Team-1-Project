import "./style.css";

type ScreenName = "start" | "garage" | "levels" | "minigames" | "shop";
type MinigameName = "answers" | "solver";
type ShopTabName = "car-colors" | "upgrades" | "cosmetics";

const screenNames: readonly ScreenName[] = [
  "start",
  "garage",
  "levels",
  "minigames",
  "shop",
];

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Could not find the "${selector}" element.`);
  }

  return element;
}

const message = requireElement<HTMLParagraphElement>("#message");
let currentScreen: ScreenName = "start";

function isScreenName(value: string | undefined): value is ScreenName {
  return screenNames.some((screenName) => screenName === value);
}

function showScreen(screenName: ScreenName): void {
  document.querySelectorAll<HTMLElement>(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  const screen = document.getElementById(screenName);
  if (!screen) {
    throw new Error(`Could not find the "${screenName}" screen.`);
  }

  screen.classList.add("active");
  currentScreen = screenName;
  message.textContent = "";
}

function selectLevelOne(): void {
  message.textContent = "LEVEL 1 SELECTED! COMING SOON!";
}

function selectMinigame(gameName: MinigameName): void {
  document.querySelectorAll<HTMLButtonElement>(".minigame-card").forEach((card) => {
    const isSelected = card.dataset.minigame === gameName;
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });

  message.textContent = "COMING SOON!";
}

function selectShopTab(tabName: ShopTabName): void {
  document.querySelectorAll<HTMLButtonElement>(".shop-tab").forEach((tab) => {
    const isActive = tab.dataset.shopTab === tabName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });

  message.textContent = tabName === "upgrades" ? "" : "COMING SOON!";
}

function selectShopItem(itemName: string): void {
  message.textContent = `${itemName} - COMING SOON!`;
}

document.querySelectorAll<HTMLButtonElement>("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => {
    const screenName = button.dataset.screen;
    if (!isScreenName(screenName)) {
      throw new Error(`Invalid screen name: "${screenName ?? ""}".`);
    }

    showScreen(screenName);
  });
});

requireElement<HTMLButtonElement>(
  '[data-level-action="select"]',
).addEventListener("click", selectLevelOne);

document.querySelectorAll<HTMLButtonElement>("[data-minigame]").forEach((button) => {
  button.addEventListener("click", () => {
    const gameName = button.dataset.minigame;
    if (gameName !== "answers" && gameName !== "solver") {
      throw new Error(`Invalid minigame name: "${gameName ?? ""}".`);
    }

    selectMinigame(gameName);
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-shop-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.shopTab;
    if (
      tabName !== "car-colors" &&
      tabName !== "upgrades" &&
      tabName !== "cosmetics"
    ) {
      throw new Error(`Invalid shop tab: "${tabName ?? ""}".`);
    }

    selectShopTab(tabName);
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-shop-item]").forEach((button) => {
  button.addEventListener("click", () => {
    const itemName = button.dataset.shopItem;
    if (!itemName) {
      throw new Error("Shop item button is missing its item name.");
    }

    selectShopItem(itemName);
  });
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.code === "Space" && currentScreen === "start") {
    event.preventDefault();
    showScreen("garage");
  }

  if (
    event.code === "Escape" &&
    (currentScreen === "levels" ||
      currentScreen === "minigames" ||
      currentScreen === "shop")
  ) {
    showScreen("garage");
  }
});
