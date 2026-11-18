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

    setQuestion(question: Question): void {
        this.question = question;
    }

    getQuestion(): Question | null {
        return this.question;
    }
}