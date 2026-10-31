import {Answerable} from "answerChecker.ts";
import {computeCorrectAnswer, parseInput, checkAnswer} from "answerChecker.ts"
//import question view
export class QuestionController {
    private currentQuestion: Answerable | null = null;
    //private model: QuestionModel
    //private view: QuestionView

    //question generation factory  
    generateQuestion(q_type: string) : Answerable{
        let a = Math.floor(Math.random() *  10) + 1;  
        let b = Math.floor(Math.random() *  10) + 1; 

        //Generates question object based upon chosen type
        switch (q_type) {
            case 'addition':
                return new AdditionQuestion(a, b);
            case 'subtraction':
                return new SubtractionQuestion(a, b);
            case 'multiplication':
                return new MultiplicationQuestion(a, b);
            case 'division':
                //Recalculates a to be divisible by b
                a = b * Math.floor(Math.random() * 10) + 1; 
                return new DivisionQuestion(a, b);
        
            default:
                throw new Error("Incorrect question type");
        }
    }
    // Fuction to handle answer submission event
        //Check input with answer from question object
    private checkAnswerInput(answer: string): void{
        if (checkAnswer(answer)){
            //tell view to display green check
        }
        else{
            //tell view to display red x
        }
    } 
}