import {LaneGameModel} from "../../LaneGameModel.ts"
import {QuestionController} from "./QuestionController.ts"

export class LaneGameController {
    private model: LaneGameModel;
    private questionGenerator: QuestionController
    constructor(){
        this.model = new LaneGameModel();
        this.questionGenerator = new QuestionController();
    }

    startGame(): void {
        this.model.reset();
    }

    /**
     * Generates three questions to place inside the lanes
     */
    private generateRound(): void{
        const lanes = this.model.getLanes();

        for (const lane of lanes) {
            //Generates a new question for each lane
            //Right now just generates 3 addition questions
            const question = this.QuestionController.generateQuestion("addition");
            lane.setQuestion(question);
        }
    }

    private handleCarMovement(): void {
        //Key press is detected in view 
        // calls view function to move the car to another lane
        // sets current lane to that lane
    }

    private handleLaneSelection(): void {
        // When car touches the expression in its current lane
        // checks if that lanes expression matches the right answe given
        // updates score
        // generates a new round
        generateRound();
    }

    private endGame(): void {
        // Switch to results screen with final score
    }

    getFinalScore(): number {
        return this.model.getScore();
    }
}