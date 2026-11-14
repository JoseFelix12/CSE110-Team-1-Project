const CHECKER_SIZE = 8;

/** Which lamps are lit: 3 = red, 2 = red + yellow, 1 = yellow, 0 = green */
export type CountdownValue = 3 | 2 | 1 | 0;

/**
 * TrafficLight - The starting light on a pole beside the road.
 */
export class TrafficLight {
    /**
     * Draws the light with its pole at x and its base at groundY.
     * Pass null to draw every lamp switched off.
     */
    draw(ctx: CanvasRenderingContext2D, x: number, groundY: number, value: CountdownValue | null): void {
        const left = Math.round(x);
        const lampTop = groundY - 126;

        ctx.fillStyle = '#23263a';
        ctx.fillRect(left + 15, lampTop + 66, 6, groundY - lampTop - 66);
        ctx.fillStyle = '#17181c';
        ctx.fillRect(left, lampTop, 36, 72);

        this.drawLamp(ctx, left, lampTop + 4, value === 3 || value === 2, '#ff3b30', '#4a1512');
        this.drawLamp(ctx, left, lampTop + 26, value === 2 || value === 1, '#ffd60a', '#4a3f0c');
        this.drawLamp(ctx, left, lampTop + 48, value === 0, '#30d158', '#123f1f');
    }

    private drawLamp(
        ctx: CanvasRenderingContext2D,
        left: number,
        top: number,
        lit: boolean,
        onColor: string,
        offColor: string,
    ): void {
        ctx.fillStyle = lit ? onColor : offColor;
        ctx.fillRect(left + 12, top, 12, 20);
        ctx.fillRect(left + 8, top + 4, 20, 12);
    }
}

/**
 * FinishLine - Checkered line across the road with a waving flag beside it.
 */
export class FinishLine {
    private time = 0;

    update(dt: number): void {
        this.time += dt;
    }

    /**
     * Draws the line at x, between roadTop and roadTop + roadHeight
     */
    draw(ctx: CanvasRenderingContext2D, x: number, roadTop: number, roadHeight: number): void {
        const left = Math.round(x);

        for (let row = 0; row * CHECKER_SIZE < roadHeight; row++) {
            for (let column = 0; column < 3; column++) {
                ctx.fillStyle = (row + column) % 2 === 0 ? '#ffffff' : '#111111';
                ctx.fillRect(left + column * CHECKER_SIZE, roadTop + row * CHECKER_SIZE, CHECKER_SIZE, CHECKER_SIZE);
            }
        }

        const poleTop = roadTop - 92;
        ctx.fillStyle = '#23263a';
        ctx.fillRect(left + 10, poleTop, 4, 92);
        this.drawFlag(ctx, left + 14, poleTop);
    }

    private drawFlag(ctx: CanvasRenderingContext2D, left: number, top: number): void {
        const columns = 7;
        const rows = 5;
        const size = 6;
        for (let column = 0; column < columns; column++) {
            const wave = Math.round(Math.sin(this.time * 8 + column * 0.8) * 2);
            for (let row = 0; row < rows; row++) {
                ctx.fillStyle = (row + column) % 2 === 0 ? '#ffffff' : '#111111';
                ctx.fillRect(left + column * size, top + row * size + wave, size, size);
            }
        }
    }
}
