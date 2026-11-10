import { AMOUNT_OF_QUESTIONS_IN_LEVEL_1 } from "../constants.ts";
import { createOpponents } from "./Opponent.ts";
import type { Opponent } from "./Opponent.ts";

/**
 * RaceClassModel - Manages game state
 */
export class RaceClassModel {
    private correct_answers = 0;
    private incorrect_answers = 0;
    private correctAnswerStreak = 0;
    private incorrectAnswerStreak = 0;
    private health = 100;
    private opponents: Opponent[];
    private finishPlace: number | null = null;

    constructor(random: () => number = Math.random) {
        this.opponents = createOpponents(AMOUNT_OF_QUESTIONS_IN_LEVEL_1, random);
    }

    /**
     * Resets for new race
     */
    reset(): void {
        this.correct_answers = 0;
        this.incorrect_answers = 0;
        this.correctAnswerStreak = 0;
        this.incorrectAnswerStreak = 0
        this.health = 100;
        this.finishPlace = null;
        this.opponents.forEach((opponent) => opponent.reset());
    }

    /**
     * Increments correct_answers if the answer is correct
     */
    incrementCorrect_Answers(): void {
        this.correct_answers++;
    }

    /**
     * Increments incorrect_answers if the answer is incorrect
     */
    incrementIncorrect_Answers(): void {
        this.incorrect_answers++;
    }

    /**
     * Gets current progress
     */
    currentProgess(): number {
        return (this.correct_answers + this.incorrect_answers)/AMOUNT_OF_QUESTIONS_IN_LEVEL_1;
    }

    /**
     * Amount of correct answers in a row
     */
    incrementStreak(): void {
        this.correctAnswerStreak++;
    }

    /**
     * Resets streak if wrong answer
     */
    resetcorrectStreak(): void {
        this.correctAnswerStreak = 0;
    }

    /**
     * Resets streak if wrong answer
     */
    resetIncorrectStreak(): void {
        this.incorrectAnswerStreak = 0;
    }

    /**
     * Amount of incorrect answers in a row
     */
    incrementIncorrectStreak(): void {
        this.incorrectAnswerStreak++;
    }

    /**
     * Decrements health per wrong answer
     */
    decreasesHealth(): void {
        if(this.incorrectAnswerStreak >= 3)
        this.health = this.health / 10;
        this.incorrectAnswerStreak = 0;
    }

    // ---------- Opponents ----------

    /**
     * Moves every bot along by dt seconds
     */
    updateOpponents(dt: number): void {
        this.opponents.forEach((opponent) => opponent.update(dt));
    }

    getOpponents(): readonly Opponent[] {
        return this.opponents;
    }

    /**
     * Locks in the player's place once they answer the last question.
     * Bots that finished first are ahead.
     */
    recordFinish(): void {
        if (this.finishPlace === null) {
            this.finishPlace = 1 + this.opponents.filter((opponent) => opponent.isFinished()).length;
        }
    }

    /**
     * The player's place, 1 = first. During the race, ties go to the player.
     */
    getPlacement(): number {
        if (this.finishPlace !== null) {
            return this.finishPlace;
        }
        const progress = this.currentProgess();
        return 1 + this.opponents.filter((opponent) => opponent.getProgress() > progress).length;
    }

    getRacerCount(): number {
        return this.opponents.length + 1;
    }
}