import { describe, expect, it } from 'vitest';
import { createOpponents, Opponent, OPPONENT_PROFILES, pickOpponentColors, sampleNormal } from './Opponent.ts';

/** Average and spread of the time between answers, over many questions */
function measureAnswerTimes(opponent: Opponent, questions: number): { mean: number; stdDev: number } {
    const dt = 0.01;
    const times: number[] = [];
    let elapsed = 0;
    let answered = 0;
    while (times.length < questions) {
        opponent.update(dt);
        elapsed += dt;
        if (opponent.getAnsweredCount() > answered) {
            answered = opponent.getAnsweredCount();
            times.push(elapsed);
            elapsed = 0;
        }
    }
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + (time - mean) ** 2, 0) / times.length;
    return { mean, stdDev: Math.sqrt(variance) };
}

describe('Opponent', () => {
    it('uses the easy, medium and hard answer times and colors', () => {
        expect(OPPONENT_PROFILES.easy).toMatchObject({ color: 'yellow', meanSeconds: 6, stdDevSeconds: 1 });
        expect(OPPONENT_PROFILES.medium).toMatchObject({ color: 'blue', meanSeconds: 4, stdDevSeconds: 1 });
        expect(OPPONENT_PROFILES.hard).toMatchObject({ color: 'green', meanSeconds: 3.5, stdDevSeconds: 0.5 });
    });

    it.each(['easy', 'medium', 'hard'] as const)('answers at the %s average and spread', (difficulty) => {
        const profile = OPPONENT_PROFILES[difficulty];
        const opponent = new Opponent(profile, Infinity);
        const { mean, stdDev } = measureAnswerTimes(opponent, 2000);
        expect(Math.abs(mean - profile.meanSeconds)).toBeLessThan(0.1);
        expect(Math.abs(stdDev - profile.stdDevSeconds)).toBeLessThan(0.15);
    });

    it('does not answer before its time is up', () => {
        // random() = 0.5 gives mean - stdDev * sqrt(2 ln 2), about 2.91s for hard
        const opponent = new Opponent(OPPONENT_PROFILES.hard, 10, () => 0.5);
        opponent.update(2.9);
        expect(opponent.getAnsweredCount()).toBe(0);
        opponent.update(0.02);
        expect(opponent.getAnsweredCount()).toBe(1);
    });

    it('stops at the last question', () => {
        const opponent = new Opponent(OPPONENT_PROFILES.hard, 5);
        opponent.update(1000);
        expect(opponent.getAnsweredCount()).toBe(5);
        expect(opponent.getProgress()).toBe(1);
        expect(opponent.isFinished()).toBe(true);
    });

    it('never takes less than a second, even on an extreme roll', () => {
        // A roll near 1, then 0.5, gives 3.5 - 0.5 * 5.26, about 0.87s before the limit
        let roll = 0;
        const opponent = new Opponent(OPPONENT_PROFILES.hard, 10, () => (roll++ % 2 === 0 ? 0.999999 : 0.5));
        opponent.update(0.99);
        expect(opponent.getAnsweredCount()).toBe(0);
        opponent.update(0.02);
        expect(opponent.getAnsweredCount()).toBe(1);
    });

    it('reset starts the bot over', () => {
        const opponent = new Opponent(OPPONENT_PROFILES.easy, 5);
        opponent.update(1000);
        opponent.reset();
        expect(opponent.getProgress()).toBe(0);
        expect(opponent.isFinished()).toBe(false);
    });

    it('createOpponents makes one bot of each difficulty', () => {
        const opponents = createOpponents(10);
        expect(opponents.map((opponent) => opponent.profile.difficulty)).toEqual(['easy', 'medium', 'hard']);
    });
});

describe('sampleNormal', () => {
    it('returns the mean for the middle roll', () => {
        // cos(2π · 0.25) = 0, so the spread term drops out
        expect(sampleNormal(4, 1, (() => { const rolls = [0.5, 0.25]; return () => rolls.shift()!; })())).toBeCloseTo(4);
    });
});

describe('pickOpponentColors', () => {
    const BOTS = ['yellow', 'blue', 'green'] as const;

    it('keeps the bot colors when none match the player', () => {
        expect(pickOpponentColors(BOTS, 'red')).toEqual(['yellow', 'blue', 'green']);
    });

    it('swaps a bot that matches the player for a color nobody is using', () => {
        for (const player of BOTS) {
            const colors = pickOpponentColors(BOTS, player);
            expect(colors).not.toContain(player);
            expect(new Set(colors).size).toBe(3);
        }
    });

    it('only changes the bot that matches', () => {
        expect(pickOpponentColors(BOTS, 'blue')).toEqual(['yellow', 'purple', 'green']);
    });

    it('does not reuse a color the player has', () => {
        expect(pickOpponentColors(['purple', 'blue'], 'blue')).toEqual(['purple', 'pink']);
    });
});
