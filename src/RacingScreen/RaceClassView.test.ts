/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RaceClassView } from './RaceClassView.ts';

/** Every text drawn on the canvas, with the alpha it was drawn at */
let drawn: { text: string; alpha: number }[] = [];

/**
 * A fake 2D context: any method call does nothing and returns the fake, so
 * gradients and the like also work. fillText is recorded.
 */
function fakeContext(): CanvasRenderingContext2D {
    const state: Record<string | symbol, unknown> = { globalAlpha: 1 };
    const fake: CanvasRenderingContext2D = new Proxy(state, {
        get(target, key) {
            if (key === 'fillText') {
                return (text: string) => drawn.push({ text, alpha: target.globalAlpha as number });
            }
            if (key in target) {
                return target[key];
            }
            return () => fake;
        },
        set(target, key, value) {
            target[key] = value;
            return true;
        },
    }) as unknown as CanvasRenderingContext2D;
    return fake;
}

describe('RaceClassView', () => {
    let view: RaceClassView;

    const nitroMessages = () => drawn.filter((d) => d.text === 'NITRO READY!');
    /** Runs one frame and returns the nitro messages drawn in it */
    const frame = (dt: number) => {
        drawn = [];
        view.update(dt);
        return nitroMessages();
    };

    beforeEach(() => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
            () => fakeContext() as never,
        );
        view = new RaceClassView({
            onAnswerSubmit: () => {},
            onNitro: () => {},
            onFinishLineCrossed: () => {},
            onQuit: () => {},
        } as never);
        view.mount(document.body);
        view.startRace();
    });

    afterEach(() => {
        view.destroy();
        vi.restoreAllMocks();
    });

    it('shows when the bar fills, then fades away', () => {
        view.setNitroLevel(0.5);
        expect(frame(0.1)).toHaveLength(0);

        view.setNitroLevel(1);
        expect(frame(0.1)).toEqual([{ text: 'NITRO READY!', alpha: 1 }]);

        // Still fully visible just before 2 seconds
        expect(frame(1.8)[0].alpha).toBe(1);

        // Fading during the last half second
        const fading = frame(0.35)[0].alpha;
        expect(fading).toBeGreaterThan(0);
        expect(fading).toBeLessThan(1);

        // Gone afterwards
        expect(frame(0.5)).toHaveLength(0);
    });

    it('only shows once while the bar stays full', () => {
        view.setNitroLevel(1);
        frame(3);
        view.setNitroLevel(1);
        expect(frame(0.1)).toHaveLength(0);
    });

    it('hides as soon as nitro is used', () => {
        view.setNitroLevel(1);
        expect(frame(0.1)).toHaveLength(1);
        view.setNitroActive(true);
        expect(frame(0.1)).toHaveLength(0);
    });

    it('shows owned upgrades and hides the shield icon when its count reaches zero', () => {
        const hud = document.querySelector<HTMLUListElement>('.race-view__upgrades')!;
        expect(hud.hidden).toBe(true);

        view.setUpgrades(['Speed Boost', 'Better Tires', 'Extra Time', 'Shield', 'Shield']);

        expect(hud.hidden).toBe(false);
        expect(Array.from(hud.querySelectorAll('img'), (icon) => icon.alt))
            .toEqual(['Speed Boost', 'Better Tires', 'Extra Time', 'Shield']);
        const shield = hud.querySelector('[title="Shield"]');
        expect(shield?.textContent).toBe('×2');
        expect(shield?.querySelector('img')?.getAttribute('src'))
            .toBe('/images/shop/upgrades/shield.png');

        view.setUpgrades(['Speed Boost', 'Better Tires', 'Extra Time']);

        expect(hud.querySelector('[title="Shield"]')).toBeNull();
        expect(hud.querySelectorAll('img')).toHaveLength(3);
    });
});
