import {LaneGameModel} from "./LaneGameModel.ts"
import {QuestionController} from "../Question/QuestionController.ts"
import {GameState} from "../Game/GameState.ts"
import {CatchTheAnswer} from "../UI/CatchTheAnswer.ts"
import {Game} from "../Game/Game.ts"

export class LaneGameController {
    private model: LaneGameModel;
    private game: Game;
    private questionGenerator: QuestionController
    private catchTheAnswer: CatchTheAnswer;

    private state: GameState;
    constructor(game: Game){
        this.game = game;
        this.model = new LaneGameModel();
        this.questionGenerator = new QuestionController();
        this.catchTheAnswer = new CatchTheAnswer(
            this.game, 
            this, 
            this.model,
            () => this.handleLaneSelection()
        );
        this.state = new GameState();
    }

    startGame(): void {
        this.model.reset();
    }

    /**
     * Generates three questions to place inside the lanes
     */
    generateRound(): void{
        const lanes = this.model.getLanes();

        for (const lane of lanes) {
            //Generates a new question for each lane
            
            const question = this.questionGenerator.generateQuestion(this.state.getCurrentLevelId());
            lane.setQuestion(question);
            
        }
        // Randomly select one of the lanes to be the correct answer
        const randomLaneIndex = Math.floor(Math.random() * lanes.length);
        const targetLane = lanes[randomLaneIndex];
        this.model.setAnswer(targetLane.getQuestion()?.answer || 0);
    }

    handleCarMovement(key: "ArrowLeft" | "ArrowRight"): void {
        // Key press is detected in view 
        // Finds the current lane and moves the car to the left or right lane based on the key pressed
        const lanes = this.model.getLanes();
        const currentLane = this.model.getCurrentLane();
        const currentIndex = lanes.indexOf(currentLane);

        if (key === "ArrowLeft" && currentIndex > 0) {
            this.model.setCurrentLane(lanes[currentIndex - 1]);
        } else if (key === "ArrowRight" && currentIndex < lanes.length - 1) {
            this.model.setCurrentLane(lanes[currentIndex + 1]);
        }
    }

    handleLaneSelection(): void {
        // When car touches the expression in its current lane
        // checks if that lanes expression matches the right answe given

        if (!this.model.getCurrentLane().getQuestion()) {
            return;
        }
        const laneQuestion = this.model.getCurrentLane().getQuestion();
        const correct = this.questionGenerator.submitAnswer(String(laneQuestion?.answer));

        if(correct) {
            // Updates score
            this.model.incrementScore();
            this.model.incrementCorrectCount();
        }
        this.catchTheAnswer.updateScore();
        this.catchTheAnswer.showFeedback(correct);
        
    }

    private endGame(): void {
        // Switch to results screen with final score
    }

    getFinalScore(): number {
        return this.model.getScore();
    }
}