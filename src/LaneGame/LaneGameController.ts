import {LaneGameModel} from "./LaneGameModel.ts"
import {QuestionController} from "../Question/QuestionController.ts"
import {GameState} from "../Game/GameState.ts"
import {CatchTheAnswer} from "../UI/LaneGameScreen.ts"
import type { Question } from "../Question/QuestionModel.ts";
import {Game} from "../Game/Game.ts"

export class LaneGameController {
    private model: LaneGameModel;
    private game: Game;
    private questionGenerator: QuestionController
    private catchTheAnswer: CatchTheAnswer;
    private state: GameState;
    private wrongAnswers: {
        question: Question;
        playerAnswer: string | null;
        correctChoice: string;
    }[] = [];

    constructor(game: Game){
        this.game = game;
        this.model = new LaneGameModel();
        this.questionGenerator = new QuestionController();
        this.state = new GameState();
        this.catchTheAnswer = new CatchTheAnswer(
            this.game,
            this,
            this.model
        );
        
    }

    static create(game: Game): CatchTheAnswer {
        const controller = new LaneGameController(game);
        return controller.catchTheAnswer;
    }

    startGame(): void {
        this.model.reset();
        this.wrongAnswers = [];
    }

    /**
     * Generates three questions to place inside the lanes
     */
    generateRound(): void{
        const lanes = this.model.getLanes();

        const usedQuestions = new Set<string>();
        const usedAnswers = new Set<number>();
        const ranLevel = Math.floor(Math.random() * this.state.getCurrentLevelId()) + 1; // Randomly selects a level up to the current level
        
        for (const lane of lanes) {
            //Generates a new question for each lane
            let question;
            
            // Ensures that the generated question is unique and that the answer is also unique
            // Generates questions up to current level
            do {

                question = this.questionGenerator.generateQuestion(ranLevel);
            } while (
                usedQuestions.has(question.text) ||
                usedAnswers.has(question.answer)
            )

            usedQuestions.add(question.text);
            usedAnswers.add(question.answer);
            lane.setQuestion(question);
            
            
        }
        // Randomly select one of the lanes to be the correct answer
        const randomLaneIndex = Math.floor(Math.random() * lanes.length);
        const targetLane = lanes[randomLaneIndex];
        this.model.setAnswer(targetLane.getQuestion()?.answer ?? 0);
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

        const laneQuestion = this.model.getCurrentLane().getQuestion();

        if (!laneQuestion) return;

        const correct = laneQuestion.answer === this.model.getTargetAnswer();

        if (correct) {
    // Updates score
    this.model.incrementScore();
    this.model.incrementCorrectCount();
} else {
    const target = this.model.getTargetAnswer();

    const correctQuestion = this.model.getLanes()
        .map(lane => lane.getQuestion())
        .find(question => question?.answer === target);

    if (correctQuestion) {
        this.wrongAnswers.push({
            question: {
                ...correctQuestion,
                text: `Choose the expression equal to ${target}`,
            },
            playerAnswer: laneQuestion.text.replace(/\s*=\s*\?$/, ""),
            correctChoice: correctQuestion.text.replace(/\s*=\s*\?$/, ""),
        });
    }
}
        this.catchTheAnswer.updateScore();
        this.catchTheAnswer.showFeedback(correct);
        
    }

    getWrongAnswers() {
    return [...this.wrongAnswers];
}

    getFinalScore(): number {
        return this.model.getScore();
    }
}