

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
                this.currentQuestion = new AdditionQuestion(a, b);
                break;
            case 'subtraction':
                this.currentQuestion = new SubtractionQuestion(a, b);
                break;
            case 'multiplication':
                this.currentQuestion = new MultiplicationQuestion(a, b);
                break;
            case 'division':
                //Recalculates a to be divisible by b
                a = b * (Math.floor(Math.random() * 10) + 1); 
                this.currentQuestion = new DivisionQuestion(a, b);
                break;
            default:
                throw new Error("Incorrect question type");
        }
        return this.currentQuestion;
    }  

    //Compares answer that will be entered by user from view with the correct answer.
    function checkAnswer(question: Question, input: string): boolean {
        const userAnswer = Number(input);
        
        //checks if input was not a number
        if (Number.isNaN(userAnswer) || input.trim() === "") {
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

        if (this.currentQuestion === null){
            return
        }

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