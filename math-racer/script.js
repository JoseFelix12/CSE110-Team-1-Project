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

document.addEventListener("keydown", event => {
  if (event.code === "Space" && currentScreen === "start") {
    event.preventDefault();
    showScreen("garage");
  }

  if (event.code === "Escape" && currentScreen === "levels") {
    showScreen("garage");
  }
});
