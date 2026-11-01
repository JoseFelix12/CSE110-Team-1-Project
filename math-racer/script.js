let currentScreen = "start";

function showScreen(screenName) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(screenName).classList.add("active");
  currentScreen = screenName;
  document.getElementById("message").textContent = "";
}

function selectLevelOne() {
  document.getElementById("message").textContent =
    "LEVEL 1 SELECTED! COMING SOON!";
}

function selectMinigame(gameName) {
  const cards = document.querySelectorAll(".minigame-card");
  cards.forEach(card => {
    const isSelected = card.classList.contains(`${gameName}-card`);
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });

  document.getElementById("message").textContent = "COMING SOON!";
}

function selectShopTab(tab) {
  document.querySelectorAll(".shop-tab").forEach(shopTab => {
    const isActive = shopTab === tab;
    shopTab.classList.toggle("active", isActive);
    shopTab.setAttribute("aria-pressed", String(isActive));
  });

  document.getElementById("message").textContent =
    tab.classList.contains("active") && tab.textContent.includes("UPGRADES")
      ? ""
      : "COMING SOON!";
}

function selectShopItem(itemName) {
  document.getElementById("message").textContent = `${itemName} - COMING SOON!`;
}

document.addEventListener("keydown", event => {
  if (event.code === "Space" && currentScreen === "start") {
    event.preventDefault();
    showScreen("garage");
  }

  if (event.code === "Escape" && (currentScreen === "levels" || currentScreen === "minigames" || currentScreen === "shop")) {
    showScreen("garage");
  }
});
