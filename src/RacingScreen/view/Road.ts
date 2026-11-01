import { drawRepeating, variation } from './scrolling.ts';

/**
 * Road - The ground the car drives on. Subclasses pick the colors and markings.
 * Add a new road type by extending this class and adding it to RACE_THEMES.
 */
export abstract class Road {
    protected abstract readonly surfaceColor: string;
    protected abstract readonly edgeColor: string;
    protected readonly edgeHeight: number = 12;

    /**
     * Draws the road between top and top + height
     */
    draw(ctx: CanvasRenderingContext2D, cameraX: number, width: number, top: number, height: number): void {
        ctx.fillStyle = this.edgeColor;
        ctx.fillRect(0, top, width, height);
        ctx.fillStyle = this.surfaceColor;
        ctx.fillRect(0, top + this.edgeHeight, width, height - this.edgeHeight * 2);
        this.drawMarkings(ctx, cameraX, width, top, height);
    }

    protected abstract drawMarkings(
        ctx: CanvasRenderingContext2D,
        cameraX: number,
        width: number,
        top: number,
        height: number,
    ): void;
}

/** Packed dirt with tire ruts and loose stones */
export class DirtRoad extends Road {
    protected readonly surfaceColor = '#a9713f';
    protected readonly edgeColor = '#6d8b3c';

    protected drawMarkings(
        ctx: CanvasRenderingContext2D,
        cameraX: number,
        width: number,
        top: number,
        height: number,
    ): void {
        const middle = top + height / 2;
        ctx.fillStyle = '#8f5d31';
        ctx.fillRect(0, middle - 14, width, 4);
        ctx.fillRect(0, middle + 14, width, 4);

        drawRepeating(cameraX, 1, 40, width, (x, index) => {
            ctx.fillStyle = index % 2 === 0 ? '#c08a56' : '#7d5029';
            ctx.fillRect(x + variation(index, 30), top + 16 + variation(index + 7, height - 34), 4, 2);
        });
    }
}

/** Asphalt circuit with red and white curbs */
export class RaceTrackRoad extends Road {
    protected readonly surfaceColor = '#3d3f46';
    protected readonly edgeColor = '#f4f4f4';

    protected drawMarkings(
        ctx: CanvasRenderingContext2D,
        cameraX: number,
        width: number,
        top: number,
        height: number,
    ): void {
        drawRepeating(cameraX, 1, 48, width, (x) => {
            ctx.fillStyle = '#d3302f';
            ctx.fillRect(x, top, 24, this.edgeHeight);
            ctx.fillRect(x, top + height - this.edgeHeight, 24, this.edgeHeight);
        });
        ctx.fillStyle = '#f4f4f4';
        ctx.fillRect(0, top + this.edgeHeight + 4, width, 2);
        ctx.fillRect(0, top + height - this.edgeHeight - 6, width, 2);
    }
}

/** City street with sidewalks and a dashed yellow center line */
export class StreetRoad extends Road {
    protected readonly surfaceColor = '#55585f';
    protected readonly edgeColor = '#b4b4ac';

    protected drawMarkings(
        ctx: CanvasRenderingContext2D,
        cameraX: number,
        width: number,
        top: number,
        height: number,
    ): void {
        drawRepeating(cameraX, 1, 32, width, (x) => {
            ctx.fillStyle = '#8f8f88';
            ctx.fillRect(x, top, 2, this.edgeHeight);
            ctx.fillRect(x, top + height - this.edgeHeight, 2, this.edgeHeight);
        });
        drawRepeating(cameraX, 1, 64, width, (x) => {
            ctx.fillStyle = '#e8c43a';
            ctx.fillRect(x, top + height / 2 - 2, 36, 4);
        });
    }
}
