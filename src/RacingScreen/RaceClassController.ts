import { QUESTION_TIMER } from "../constants";
import { RaceClassModel } from "./RaceClassModel";
import type { screenSwitcher } from "../Game/Game";
export class RaceClassController {
    private model: RaceClassModel;
    //private view: RaceClassView
    private screenSwitcher: screenSwitcher;
    private questionTimer: number | null = null;
    private countdownTimer: number | null = null;

    constructor(screenSwitcher: ScreenSwitcher) {
		super();
		this.screenSwitcher = screenSwitcher;

		this.model = new RaceClassModel();
		//this.view = new GameScreenView(() 

		//this.carSound = new Audio(""); // Placeholder
        //this.correctAnswer = new Audio("")
        //this.wrongAnswer = new Audio("")
	}
    /**
     * Starts Game
     */
    startGame(): void {
        this.model.reset()
        //this.view.setCar() puts car in starting position
        this.startCountdown();
    }

    /**
	 * Start the question timer
	 */
	private startQuestionTimer(): void {
		let timeRemaining: number  = QUESTION_TIMER;
		const timerId = setInterval(() => {
			timeRemaining -= 1;
			//this.view.updateTimer(timeRemaining);
			if(timeRemaining <= 0){
				this.stopQuestionTimer();
			}
		}, 1000);
		this.questionTimer = timerId;
	}
    
    private stopQuestionTimer(): void {
        if(this.questionTimer != null){
            clearInterval(this.questionTimer);
            this.questionTimer = null;
            this.model.incrementIncorrect_Answers();
            if(this.model.currentProgess() < 1){
                //generates another question
            }
            else if (this.model.currentProgess() == 1){
                this.endGame();
            }
        }
    }

    /**
     * Handles question generation
     */

    /**
     * Handles answer checking
     */

    /**
     * Starts the race countdown
     */
    private startCountdown(): void {
		let timeRemaining: number  = QUESTION_TIMER;
		const timerId = setInterval(() => {
			timeRemaining -= 1;
			//this.view.updateTimer(timeRemaining);
			if(timeRemaining <= 0){
				//Hides the countdown
                //Starts the race by generating a question
			}
		}, 1000);
		this.countdownTimer = timerId;
	}

    /**
     * End race
     */
    private endGame(): void {
        //switches screen to result or menu for demo
        //this.screenSwitcher.switchToScreen({
			//switches to level screen

		//});
    }

    /**
     * View tells when pause button is pressed
     */


        /**
         * View tells when Resume button is pressed
         */

        /**
         * View tells when Quit button is pressed
         */

        /**
         * Possible audio button is pressed 
         */

    /**
     * Detect user input
     */

        /**
         * Detect user backspace
         */

        /**
         * Detect user enter
         */

        /**
         * Reject input that isn't a number
         */
}