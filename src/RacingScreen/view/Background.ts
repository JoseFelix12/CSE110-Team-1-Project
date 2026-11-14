import { drawRepeating, variation } from './scrolling.ts';

/**
 * Background - Sky and scenery behind the road. Layers further away scroll
 * slower than the road, which makes it feel like the camera follows the car.
 */
export abstract class Background {
    protected abstract readonly skyColor: string;
    protected abstract readonly horizonColor: string;

    /**
     * Draws everything above the road. horizon is the y where the road starts.
     */
    draw(ctx: CanvasRenderingContext2D, cameraX: number, width: number, horizon: number): void {
        ctx.fillStyle = this.skyColor;
        ctx.fillRect(0, 0, width, horizon);
        ctx.fillStyle = this.horizonColor;
        ctx.fillRect(0, horizon * 0.6, width, horizon * 0.4);
        this.drawScenery(ctx, cameraX, width, horizon);
    }

    protected abstract drawScenery(
        ctx: CanvasRenderingContext2D,
        cameraX: number,
        width: number,
        horizon: number,
    ): void;
}

/** Desert mesas and cacti, paired with the dirt road */
export class DesertBackground extends Background {
    protected readonly skyColor = '#f2b66d';
    protected readonly horizonColor = '#f6d39a';

    protected drawScenery(ctx: CanvasRenderingContext2D, cameraX: number, width: number, horizon: number): void {
        drawRepeating(cameraX, 0.1, 150, width, (x, index) => {
            const mesaHeight = 34 + variation(index, 40);
            ctx.fillStyle = '#b7643f';
            ctx.fillRect(x + 10, horizon - mesaHeight, 110, mesaHeight);
            ctx.fillStyle = '#8f4a30';
            ctx.fillRect(x + 10, horizon - mesaHeight, 110, 5);
        });
        drawRepeating(cameraX, 0.45, 110, width, (x, index) => {
            ctx.fillStyle = '#3f7d3c';
            const cactusX = x + variation(index, 70);
            ctx.fillRect(cactusX, horizon - 26, 6, 26);
            ctx.fillRect(cactusX - 6, horizon - 18, 6, 4);
            ctx.fillRect(cactusX - 6, horizon - 24, 3, 8);
            ctx.fillRect(cactusX + 6, horizon - 14, 6, 4);
            ctx.fillRect(cactusX + 9, horizon - 20, 3, 8);
        });
    }
}

/** Grandstands and flags, paired with the race track */
export class StadiumBackground extends Background {
    protected readonly skyColor = '#6db7ea';
    protected readonly horizonColor = '#a7d8f5';

    private static readonly CROWD_COLORS = ['#e8c43a', '#d3302f', '#f4f4f4', '#2f6fd3', '#3f9d4a'];

    protected drawScenery(ctx: CanvasRenderingContext2D, cameraX: number, width: number, horizon: number): void {
        drawRepeating(cameraX, 0.1, 200, width, (x, index) => {
            ctx.fillStyle = '#f4f4f4';
            ctx.fillRect(x + variation(index, 120), 18 + variation(index + 3, 28), 44, 8);
        });
        drawRepeating(cameraX, 0.35, 180, width, (x, index) => {
            ctx.fillStyle = '#4a4f5c';
            ctx.fillRect(x, horizon - 62, 176, 62);
            ctx.fillStyle = '#343842';
            ctx.fillRect(x, horizon - 68, 176, 6);
            for (let row = 0; row < 5; row++) {
                for (let seat = 0; seat < 21; seat++) {
                    const color = variation(index * 100 + row * 21 + seat, StadiumBackground.CROWD_COLORS.length);
                    ctx.fillStyle = StadiumBackground.CROWD_COLORS[color];
                    ctx.fillRect(x + 4 + seat * 8, horizon - 56 + row * 10, 4, 4);
                }
            }
        });
        ctx.fillStyle = '#2f7d3a';
        ctx.fillRect(0, horizon - 6, width, 6);
    }
}

/** Skyline and street lamps, paired with the street road */
export class CityBackground extends Background {
    protected readonly skyColor = '#27305e';
    protected readonly horizonColor = '#5a4a86';

    protected drawScenery(ctx: CanvasRenderingContext2D, cameraX: number, width: number, horizon: number): void {
        drawRepeating(cameraX, 0.12, 70, width, (x, index) => {
            ctx.fillStyle = '#39406f';
            const towerHeight = 50 + variation(index, 60);
            ctx.fillRect(x, horizon - towerHeight, 66, towerHeight);
        });
        drawRepeating(cameraX, 0.35, 96, width, (x, index) => {
            const buildingHeight = 40 + variation(index + 50, 50);
            ctx.fillStyle = '#1b2040';
            ctx.fillRect(x, horizon - buildingHeight, 88, buildingHeight);
            for (let row = 0; row * 14 + 12 < buildingHeight; row++) {
                for (let column = 0; column < 5; column++) {
                    const lit = variation(index * 31 + row * 7 + column, 3) > 0;
                    ctx.fillStyle = lit ? '#f3d36b' : '#333a66';
                    ctx.fillRect(x + 6 + column * 16, horizon - buildingHeight + 6 + row * 14, 8, 7);
                }
            }
        });
        drawRepeating(cameraX, 0.7, 160, width, (x) => {
            ctx.fillStyle = '#23263a';
            ctx.fillRect(x + 40, horizon - 46, 3, 46);
            ctx.fillRect(x + 40, horizon - 46, 16, 3);
            ctx.fillStyle = '#ffe89a';
            ctx.fillRect(x + 50, horizon - 43, 6, 3);
        });
    }
}
