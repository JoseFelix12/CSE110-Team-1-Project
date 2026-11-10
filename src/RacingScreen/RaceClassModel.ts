import { AMOUNT_OF_QUESTIONS_IN_LEVEL_1, NITRO_PER_CORRECT_ANSWER, NITRO_SECONDS } from "../constants.ts";

/**
 * RaceClassModel - Manages game state 
 */
export class RaceClassModel {
    private correct_answers = 0;
    private incorrect_answers = 0;
    private incorrectAnswerStreak = 0;
    private nitroLevel = 0;
    private nitroTimeRemaining = 0;
    private nitroActive = false;


    /**
     * Resets for new race
     */
    reset(): void {
        this.correct_answers = 0;
        this.incorrect_answers = 0;
        this.incorrectAnswerStreak = 0;
        this.nitroLevel = 0;
        this.nitroTimeRemaining = 0;
        this.nitroActive = false;
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
     * Checks if the user has gotten enough questions wrong in a row to damage
     * the car
     * @return true if the streak of incorrect answers is enough to damage the 
     * car, false if not
     */
    shouldDamageCar(): boolean {
        if (this.incorrectAnswerStreak >= 3) {
            return true;
        }
        return false;
    }

    /**
     * Updates nitro amount by constant variable NITRO_PER_CORRECT_ANSWER
     */
    chargeNitro(): void {
        if (this.nitroTimeRemaining <= 0) {
            this.nitroLevel = Math.min(1, this.nitroLevel + NITRO_PER_CORRECT_ANSWER);
        }
    }

    resetNitro(): void {
        this.nitroLevel = 0;
    }

    handleNitro(): boolean {
        if (this.nitroLevel >= 1 && this.nitroTimeRemaining <= 0) {
            this.nitroTimeRemaining = NITRO_SECONDS;
            this.nitroActive = true;
            return true;
        }
        return false;
    }

    updateNitro(dt: number): void {
        if (this.nitroTimeRemaining <= 0) {
            return;
        }
        this.nitroTimeRemaining -= dt;
        if (this.nitroTimeRemaining <= 0) {
            this.nitroLevel = 0;
            this.nitroActive = false;
        }
    }

    /**
     * If nitro is used, this method helps monitor the amount of time there is
     * left for the nitro to continue. If not, it sends how much nitro they
     * currently have.
     * @returns the amount of nitro stored at the moment it is called.
     */
    getNitroLevel(): number {
        return this.nitroActive
            ? Math.max(0, this.nitroTimeRemaining / NITRO_SECONDS)
            : this.nitroLevel;
    }

    /**
     * 
     * @return whether nitro is currently used or not
     */
    isNitroActive(): boolean {
        return this.nitroActive;
    }
    //Possibility of including placement?
}