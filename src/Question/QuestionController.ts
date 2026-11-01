

import {wrong_questions, type Question, AdditionQuestion, SubtractionQuestion, MultiplicationQuestion, DivisionQuestion} from "./QuestionModel.ts"
//import question view
export class QuestionController {
    private currentQuestion: Question | null = null;
    //private view: QuestionView


    //Question generation factory  
    generateQuestion(q_type: string) : Question{
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

    //Compares answer that will be entered by user from view with the correct answer.
    export function checkAnswer(question: Question, input: string): boolean {
        const userAnswer = Number(input);
        const expectedAnswer = computeCorrectAnswer(question);
        
        //checks if input was not a number
        if (Number.isNaN(userAnswer)) {
            return false;
        }
        
        //compares user answer with actual answer
        if (userAnswer === expectedAnswer) {
            return true;
        } else {
            return false;
        }
    }

    // Fuction to handle answer submission event
        //Check input with answer from question object
    private checkAnswerInput(answer: string): void{
        const isCorrect = this.checkAnswer(this.currentQuestion, answer);
        
        if (isCorrect) {
            //update streak, questions correct
        }
        else{
            //reset streak, add to wrong_questions
            wrong_questions.push(this.currentQuestion)
        }
        //this.view.feedback.text(isCorrect ? '✓ Correct!' : '✗ Wrong, try again');
        //this.view.feedback.fill(isCorrect ? 'green' : 'crimson');
    } 
}