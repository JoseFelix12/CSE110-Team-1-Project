import { Game } from '../src/Game/Game.ts';
import { SceneIds } from '../src/Game/Scene.ts';
import type { Scene } from '../src/Game/Scene.ts';
import { RaceClassController } from '../src/RacingScreen/RaceClassController.ts';
import type { RaceTheme } from '../src/RacingScreen/RaceClassView.ts';

const query = new URLSearchParams(location.search);
const raceArea = document.getElementById('race') as HTMLElement;
const result = document.getElementById('result') as HTMLElement;

/** Stands in for the level select screen until it exists */
class DemoLevelSelect implements Scene {
    enter(): void {
        result.textContent = 'Back at level select. Reload the page to race again.';
    }
}

// In this demo a fresh save is used every time, so old progress can't affect it
localStorage.removeItem('mathRacer.save');

const game = new Game();
game.register(SceneIds.Race, (g) => new RaceClassController(
    { switchToScreen: (id) => g.goTo(id) },
    g.state,
    { parent: raceArea, theme: (query.get('theme') ?? 'raceTrack') as RaceTheme },
));
game.register(SceneIds.LevelSelect, () => new DemoLevelSelect());
game.start(SceneIds.Race);
