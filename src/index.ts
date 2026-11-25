
import { Game } from "./Game/Game.ts";
import { SceneIds } from "./Game/Scene.ts";

import { StartScreen } from "./UI/StartScreen.ts";
import { GarageScreen } from "./UI/GarageScreen.ts";
import { TutorialScreen } from "./UI/TutorialScreen.ts";
import { LevelSelectScreen } from "./UI/LevelSelectScreen.ts";
import { MiniGameSelectScreen } from "./UI/MiniGameSelectScreen.ts";
import { StatsScreen } from "./UI/StatsScreen.ts";
import { RepairSolverScreen } from "./UI/RepairSolverScreen.ts";
import { ShopScreen } from "./UI/ShopScreen.ts";
import { WrongAnswersScreen } from "./UI/WrongAnswersScreen.ts";

import "./UI/ui.css";
import { RaceClassController } from "./RacingScreen/RaceClassController.ts";
import { LaneGameController } from "./LaneGame/LaneGameController.ts";


const game = new Game();

game.register(SceneIds.Start, (g) => new StartScreen(g));

game.register(SceneIds.Home, (g) => new GarageScreen(g));

game.register(SceneIds.Instructions, (g) => new TutorialScreen(g));

game.register(SceneIds.LevelSelect, (g) => new LevelSelectScreen(g));

game.register(SceneIds.MiniGameSelect, (g) =>
  new MiniGameSelectScreen(g)
);

game.register(SceneIds.MiniGame1, (g) =>
  LaneGameController.create(g)
);

game.register(SceneIds.MiniGame2, (g) => 
    new RepairSolverScreen(g)
);

game.register(SceneIds.Shop, (g) => new ShopScreen(g));

game.register(SceneIds.Race, (g) => new RaceClassController(
    { switchToScreen: (id) => g.goTo(id) },
    g.state,
    {
        showUpgradeHud: true,
        onRaceComplete: (params) => g.goTo(SceneIds.Stats, params)
    }
));

game.register(SceneIds.Stats, (g) =>
  new StatsScreen(g)
);

game.register(SceneIds.WrongAnswers, (g) =>
  new WrongAnswersScreen(g)
);

game.start();
