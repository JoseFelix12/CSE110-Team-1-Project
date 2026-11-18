/**
 * LaneGameModel - manages the state of the lane minigame
 */
import {Lane} from "./Lane";


export class LaneGameModel {
    //tracks how many questions user currently has gotten right
    private score = 0;
    private currentLane: Lane;
    private correctCount = 0;
    private targetAnswer: number; 

    private lanes: Lane[];

    /**
     * Initializes the lanes and sets the current lane to the first lane
     */

	constructor(){
		this.lanes = [
			new Lane(1),
			new Lane(2),
			new Lane(3)
		];
        this.currentLane = this.lanes[0];
        this.targetAnswer = this.lanes[Math.floor(Math.random() * this.lanes.length)].getQuestion()?.answer || 0;
    }
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
     * Increment the count of correct answers
     */
    incrementCorrectCount(): void {
        this.correctCount++;
    }
    /**
     * Get the lane the user is currently in
     */
    getCurrentLane(): Lane {
        return this.currentLane;
    }
    /**
     * Get the number of the current lane
     */
    getCurrentLaneNumber(): number {
        return this.currentLane.getLaneNumber();
    }
    /**
     * Changes which lane the user is currently in
     */
    setLane(lane: Lane): void {
        this.currentLane = lane;
    }
    /**
     * Gets the list of lane objects 
     */
    getLanes(): Lane[] {
		return this.lanes
	}
    /**
     * Gets the current correct answer of the round
     */
    getTargetAnswer(): number {
        return this.targetAnswer;
    }
    /**
     * Sets the current answer of the round
     */
    setAnswer(answer: number){
        this.targetAnswer = answer;
    }

    /**
     * Get current score
     */
    getScore(): number {
        return this.score;
    }

}