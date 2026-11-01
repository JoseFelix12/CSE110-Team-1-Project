import type { SkinColor } from '../../Game/gameConfig.ts';

const WOBBLE_SECONDS = 0.6;
const WHEEL_RADIUS = 7;

const SKIN_COLORS: Record<SkinColor, { body: string; dark: string }> = {
    red: { body: '#d3302f', dark: '#8e1c1b' },
    blue: { body: '#2f6fd3', dark: '#1b448a' },
    green: { body: '#2f9d4a', dark: '#1b6330' },
    purple: { body: '#8a3fd3', dark: '#58238e' },
};

/**
 * CarSprite - The player's car, drawn from side-on and facing right.
 */
export class CarSprite {
    static readonly WIDTH = 72;

    private colors: { body: string; dark: string };
    private wheelAngle = 0;
    private wobbleLeft = 0;
    private time = 0;

    constructor(skin: SkinColor) {
        this.colors = SKIN_COLORS[skin];
    }

    /**
     * Starts the wobble played after a wrong answer
     */
    wobble(): void {
        this.wobbleLeft = WOBBLE_SECONDS;
    }

    /**
     * Clears the wheel spin and any wobble still playing
     */
    reset(): void {
        this.wheelAngle = 0;
        this.wobbleLeft = 0;
    }

    update(dt: number, speed: number): void {
        this.time += dt;
        this.wheelAngle += (speed * dt) / WHEEL_RADIUS;
        this.wobbleLeft = Math.max(0, this.wobbleLeft - dt);
    }

    /**
     * Draws the car with its rear at x and its wheels resting on groundY
     */
    draw(ctx: CanvasRenderingContext2D, x: number, groundY: number, moving: boolean, boosting: boolean): void {
        const left = Math.round(x);
        const bounce = moving ? Math.round(Math.sin(this.time * 30)) : 0;
        const shake = this.wobbleLeft > 0 ? Math.round(Math.sin(this.time * 50) * 3) : 0;
        const bottom = groundY - WHEEL_RADIUS + bounce;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(left + 2, groundY - 1, CarSprite.WIDTH - 4, 4);

        if (boosting) {
            this.drawFlame(ctx, left, bottom);
        }

        ctx.save();
        ctx.translate(shake, 0);

        // Spoiler
        ctx.fillStyle = this.colors.dark;
        ctx.fillRect(left, bottom - 26, 14, 4);
        ctx.fillRect(left + 5, bottom - 22, 4, 8);
        // Body
        ctx.fillStyle = this.colors.body;
        ctx.fillRect(left + 2, bottom - 14, 66, 12);
        ctx.fillRect(left + 54, bottom - 10, 18, 8);
        // Roof and windows
        ctx.fillRect(left + 18, bottom - 24, 30, 10);
        ctx.fillStyle = '#bfe6f7';
        ctx.fillRect(left + 22, bottom - 21, 11, 7);
        ctx.fillRect(left + 35, bottom - 21, 10, 7);
        // Racing stripe, skirt and lights
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(left + 6, bottom - 9, 56, 2);
        ctx.fillStyle = this.colors.dark;
        ctx.fillRect(left + 2, bottom - 3, 68, 3);
        ctx.fillStyle = '#ffe89a';
        ctx.fillRect(left + 68, bottom - 9, 4, 3);
        ctx.fillStyle = '#ff5a4d';
        ctx.fillRect(left + 2, bottom - 12, 3, 3);

        this.drawWheel(ctx, left + 16, groundY - WHEEL_RADIUS);
        this.drawWheel(ctx, left + 56, groundY - WHEEL_RADIUS);
        ctx.restore();
    }

    private drawWheel(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
        ctx.fillStyle = '#17181c';
        ctx.fillRect(centerX - WHEEL_RADIUS, centerY - WHEEL_RADIUS + 2, WHEEL_RADIUS * 2, WHEEL_RADIUS * 2 - 4);
        ctx.fillRect(centerX - WHEEL_RADIUS + 2, centerY - WHEEL_RADIUS, WHEEL_RADIUS * 2 - 4, WHEEL_RADIUS * 2);
        ctx.fillStyle = '#c9ccd3';
        ctx.fillRect(centerX - 3, centerY - 3, 6, 6);
        // A dark spoke marks the rotation
        ctx.fillStyle = '#17181c';
        ctx.fillRect(
            Math.round(centerX + Math.cos(this.wheelAngle) * 2) - 1,
            Math.round(centerY + Math.sin(this.wheelAngle) * 2) - 1,
            2,
            2,
        );
    }

    private drawFlame(ctx: CanvasRenderingContext2D, left: number, bottom: number): void {
        const flicker = Math.floor(this.time * 30) % 2 === 0 ? 8 : 0;
        ctx.fillStyle = '#ff8a1f';
        ctx.fillRect(left - 22 - flicker, bottom - 12, 22 + flicker, 8);
        ctx.fillStyle = '#ffe24d';
        ctx.fillRect(left - 12 - flicker / 2, bottom - 10, 12 + flicker / 2, 4);
    }
}
