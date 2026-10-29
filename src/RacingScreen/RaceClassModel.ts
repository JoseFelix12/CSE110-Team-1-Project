import { AMOUNT_OF_QUESTIONS_IN_LEVEL_1 } from "../constants.ts";

/**
 * RaceClassModel - Manages game state 
 */
export class RaceClassModel {
    private correct_answers = 0;
    private incorrect_answers = 0;
    private streak = 0;
    
    /**
     * Resets for new race
     */
    reset(): void {
        this.correct_answers = 0;
        this.incorrect_answers = 0;
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
        this.streak++;
    }

    /**
     * Resets streak if wrong answer
     */
    resetStreak(): void {
        this.streak = 0;
    }

    //Possibility of including placement?
}