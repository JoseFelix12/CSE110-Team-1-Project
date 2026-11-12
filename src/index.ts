import { Game } from "./Game/Game.ts";
import { SceneIds } from "./Game/Scene.ts";

import { StartScreen } from "./UI/StartScreen.ts";
import { GarageScreen } from "./UI/GarageScreen.ts";
import { LevelSelectScreen } from "./UI/LevelSelectScreen.ts";

import "./UI/ui.css";
import { RaceClassController } from "./RacingScreen/RaceClassController.ts";

const game = new Game();

game.register(SceneIds.Start, (g) => new StartScreen(g));
game.register(SceneIds.Home, (g) => new GarageScreen(g));
game.register(SceneIds.LevelSelect, (g) => new LevelSelectScreen(g));
game.register(SceneIds.Race, (g) => new RaceClassController(
    { switchToScreen: (id) => g.goTo(id) },
    g.state,
));
game.start();