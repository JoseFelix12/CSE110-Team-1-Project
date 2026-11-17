/**
 * LaneGameModel - manages the state of the lane minigame
 */

export class LaneGameModel {
    //tracks how many questions user currently has gotten right
    private score = 0;

    /**
     * Resets the score for a new try
     */
    reset(): void {
        this.score = 0;
    }
    /**
     * Increment score when the lane with the correct answer is chosen
     */
    incrementScore(): void {
        this.score++;
    }

    /**
     * Get current score
     */
    getScore(): number {
        return this.score;
    }
}