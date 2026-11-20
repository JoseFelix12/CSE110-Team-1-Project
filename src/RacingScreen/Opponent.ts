import type { SkinColor } from '../Game/gameConfig.ts';

export type OpponentDifficulty = 'easy' | 'medium' | 'hard';
export type OpponentColor = 'yellow' | 'blue' | 'green';

export interface OpponentProfile {
    difficulty: OpponentDifficulty;
    color: OpponentColor;
    /** Average seconds the bot takes to answer one question */
    meanSeconds: number;
    stdDevSeconds: number;
}

export const OPPONENT_PROFILES: Record<OpponentDifficulty, OpponentProfile> = {
    easy: { difficulty: 'easy', color: 'yellow', meanSeconds: 6, stdDevSeconds: 1 },
    medium: { difficulty: 'medium', color: 'blue', meanSeconds: 4, stdDevSeconds: 1 },
    hard: { difficulty: 'hard', color: 'green', meanSeconds: 3.5, stdDevSeconds: 0.5 },
};

/** Colors a bot switches to, in this order, when its own color matches the player's car */
const SPARE_COLORS: SkinColor[] = ['purple', 'pink', 'white', 'black', 'red', 'yellow', 'blue', 'green'];

/**
 * Picks a color for each bot so none of them matches the player's car.
 * Bots keep their own color unless it is the same as the player's, then
 * take the first spare color that no other car is using.
 */
export function pickOpponentColors(botColors: readonly SkinColor[], playerColor: SkinColor): SkinColor[] {
    const used = new Set<SkinColor>([playerColor, ...botColors]);
    return botColors.map((color) => {
        if (color !== playerColor) {
            return color;
        }
        const spare = SPARE_COLORS.find((candidate) => !used.has(candidate)) ?? color;
        used.add(spare);
        return spare;
    });
}

/** A normal sample can come out near 0 or negative, so no answer is faster than this */
const MIN_ANSWER_SECONDS = 1;

/**
 * Draws one value from a normal distribution (Box-Muller transform)
 */
export function sampleNormal(mean: number, stdDev: number, random: () => number = Math.random): number {
    const u1 = 1 - random(); // (0, 1], so the log is finite
    const u2 = random();
    return mean + stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Opponent - A bot racer. It answers one question at a time, each taking a
 * random time drawn from its profile, and moves forward with every answer.
 */
export class Opponent {
    readonly profile: OpponentProfile;
    private totalQuestions: number;
    private random: () => number;
    private answered = 0;
    private timeUntilAnswer = 0;

    constructor(profile: OpponentProfile, totalQuestions: number, random: () => number = Math.random) {
        this.profile = profile;
        this.totalQuestions = totalQuestions;
        this.random = random;
        this.reset();
    }

    /**
     * Puts the bot back at the start with a fresh answer time. Pass the
     * number of questions when it changes between races.
     */
    reset(totalQuestions = this.totalQuestions): void {
        this.totalQuestions = totalQuestions;
        this.answered = 0;
        this.timeUntilAnswer = this.nextAnswerTime();
    }

    /**
     * Counts down the current question and answers it when the time runs out
     */
    update(dt: number): void {
        if (this.isFinished()) {
            return;
        }
        this.timeUntilAnswer -= dt;
        while (this.timeUntilAnswer <= 0 && !this.isFinished()) {
            this.answered++;
            this.timeUntilAnswer += this.nextAnswerTime();
        }
    }

    getAnsweredCount(): number {
        return this.answered;
    }

    /**
     * Questions answered out of the race total, from 0 to 1
     */
    getProgress(): number {
        return Math.min(1, this.answered / this.totalQuestions);
    }

    isFinished(): boolean {
        return this.answered >= this.totalQuestions;
    }

    private nextAnswerTime(): number {
        const { meanSeconds, stdDevSeconds } = this.profile;
        return Math.max(MIN_ANSWER_SECONDS, sampleNormal(meanSeconds, stdDevSeconds, this.random));
    }
}

/**
 * Makes one easy, one medium and one hard bot
 */
export function createOpponents(totalQuestions: number, random: () => number = Math.random): Opponent[] {
    return [OPPONENT_PROFILES.easy, OPPONENT_PROFILES.medium, OPPONENT_PROFILES.hard].map(
        (profile) => new Opponent(profile, totalQuestions, random),
    );
}
