

import {type Question, AdditionQuestion, SubtractionQuestion, MultiplicationQuestion, DivisionQuestion} from "./QuestionModel.ts"

export type QuestionType = 'addition' | 'subtraction' | 'multiplication' | 'division';

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//import question view
export class QuestionController {
    private currentQuestion: Question | null = null;
    private wrong_questions: Question[] = [];
    //private view: QuestionView


    //Question generation factory. min and max are the smallest and largest
    //numbers used (e.g. 10 and 99 for 2 digit numbers)
    generateQuestion(q_type: string, min = 1, max = 10) : Question{
        let a = randomInt(min, max);
        let b = randomInt(min, max);

        //Generates question object based upon chosen type and makes the
        //current question the new object
        switch (q_type) {
            case 'addition':
                this.currentQuestion = new AdditionQuestion(a, b);
                break;
            case 'subtraction':
                //Bigger number first so the answer is never negative
                this.currentQuestion = new SubtractionQuestion(Math.max(a, b), Math.min(a, b));
                break;
            case 'multiplication':
                this.currentQuestion = new MultiplicationQuestion(a, b);
                break;
            case 'division':
                //Recalculates a to be divisible by b
                b = randomInt(Math.max(min, 1), max);
                a = b * randomInt(min, max);
                this.currentQuestion = new DivisionQuestion(a, b);
                break;
            default:
                throw new Error("Invalid question type");
        }
        return this.currentQuestion;
    }
    //Access recently generated question
    getCurrentQuestion(): Question | null {
        return this.currentQuestion;
    }

    // Returns missed questions
    getWrongQuestions(): Question[] {
        return [...this.wrong_questions];
    }
    //Checks the answer to the current question and records it if it was wrong
    submitAnswer(answer: string): boolean {
        if (this.currentQuestion === null) {
            throw new Error("No current question to submit an answer for.");
        }

        const isCorrect = this.checkAnswer(this.currentQuestion, answer);

        if (!isCorrect) {
            this.wrong_questions.push(this.currentQuestion);
        }

        return isCorrect;
    }

    //Records the current question as missed without an answer, e.g. when the
    //timer runs out
    markWrong(): void {
        if (this.currentQuestion !== null) {
            this.wrong_questions.push(this.currentQuestion);
        }
    }


    //Compares answer that will be entered by user from view with the correct answer.
    checkAnswer(question: Question, input: string): boolean {
        const userAnswer = Number(input);

        //checks if input was not a number
        if (Number.isNaN(userAnswer) || input.trim() === "") {
            return false;
        }

        //compares user answer with actual answer
        if (userAnswer === question.answer) {
            return true;
        } else {
            return false;
        }
    }
}
