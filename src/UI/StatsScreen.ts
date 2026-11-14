import type { Game } from "../Game/Game.ts";
import type { Scene, SceneParams } from "../Game/Scene.ts";

export class StatsScreen implements Scene {
  private screen: HTMLElement | null = null;
  constructor(private game: Game) {}

  enter(params: SceneParams): void {
    this.exit();
    const screen = document.createElement("section");
    screen.id = "stats-screen";
    Object.assign(screen.style, {
      position: "relative", width: "100%", maxWidth: "1400px",
      aspectRatio: "16 / 10", margin: "0 auto", overflow: "hidden",
      background: "#292929", color: "white",
      fontFamily: '"Press Start 2P", monospace',
      boxSizing: "border-box", padding: "3%",
    });
    this.screen = screen;

    if (!document.getElementById("stats-arcade-font")) {
      const font = document.createElement("link");
      font.id = "stats-arcade-font";
      font.rel = "stylesheet";
      font.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
      document.head.appendChild(font);
    }

    const back = document.createElement("button");
    back.textContent = "❮ BACK";
    Object.assign(back.style, {
      background: "#050505", border: "3px solid white", borderRadius: "15px",
      color: "white", padding: "14px 20px", cursor: "pointer",
      fontFamily: "inherit", fontSize: "clamp(9px, 1.3vw, 17px)",
    });
    back.onclick = () => this.game.back();
    screen.appendChild(back);

    const heading = document.createElement("h1");
    heading.textContent = "🏁 PLAYER STATS 🏁";
    Object.assign(heading.style, {
      textAlign: "center", fontSize: "clamp(18px, 4vw, 52px)",
      margin: "4% 0 0", lineHeight: "1.5", overflowWrap: "anywhere",
    });
    screen.appendChild(heading);
    if (params.mode === "race") {
    heading.textContent = "🏁 RACE COMPLETE! 🏁";
     }   

    const line = document.createElement("div");
    Object.assign(line.style, { width: "72%", height: "9px", background: "#ed2028", margin: "1% auto 3%" });
    screen.appendChild(line);

    const panel = document.createElement("div");
    Object.assign(panel.style, {
      background: "#080808", border: "3px solid white", borderRadius: "18px",
      width: "min(88%, 950px)", maxHeight: "65%", overflowY: "auto",
      margin: "0 auto", padding: "clamp(16px, 3vw, 38px)",
      boxSizing: "border-box", display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px",
    });

    const state = this.game.state;
    const levels = state.getLevels();
    const unlocked = levels.filter((level) => level.unlocked);
    const highest = unlocked.length ? unlocked[unlocked.length - 1].id : 1;

    const addStat = (label: string, value: string): void => {
      const tile = document.createElement("div");
      Object.assign(tile.style, {
        background: "#202020", border: "2px solid #aaa", borderRadius: "8px",
        padding: "clamp(10px, 2vw, 22px)", minWidth: "0", textAlign: "center",
      });
      const caption = document.createElement("div");
      caption.textContent = label;
      Object.assign(caption.style, {
        fontSize: "clamp(8px, 1vw, 13px)", lineHeight: "1.8", overflowWrap: "anywhere",
      });
      const number = document.createElement("div");
      number.textContent = value;
      Object.assign(number.style, {
        color: "#ffd32a", fontSize: "clamp(12px, 2vw, 25px)",
        marginTop: "16px", lineHeight: "1.5", overflowWrap: "anywhere",
      });
      tile.append(caption, number);
      panel.appendChild(tile);
    };

    addStat("TOTAL COINS", String(state.getCoins()));
    addStat(
    "STARS EARNED",
         params.mode === "race"
    ? "⭐".repeat(Number(params.stars ?? 0)) + "☆".repeat(3 - Number(params.stars ?? 0))
    : "⭐".repeat(state.getTotalStars())
    );
    addStat("HIGHEST UNLOCKED", `LEVEL ${highest}`);
    addStat("LEVELS UNLOCKED", `${unlocked.length} / ${levels.length}`);

    screen.appendChild(panel);
    document.getElementById("game")!.appendChild(screen);
  }

  exit(): void {
    this.screen?.remove();
    this.screen = null;
  }
}
