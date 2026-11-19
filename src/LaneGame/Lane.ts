import type { Question } from "../Question/QuestionModel.ts";

/**
 * Class for the state of of a lane for the lane minigame
 */

export class Lane {
    private laneNumber: number;
    private question: Question | null;

    constructor(laneNumber: number) {
        this.laneNumber = laneNumber;
        this.question = null;
    }
    /**
     * Sets the question for this lane
     */
    setQuestion(question: Question): void {
        this.question = question;
    }
    /**
     * Gets the question for this lane
     */
    getQuestion(): Question | null {
        return this.question;
    }
    /**
     * Gets the lane number for this lane
     */
    getLaneNumber(): number {
        return this.laneNumber;
    }
}