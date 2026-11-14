

import {type Question, AdditionQuestion, SubtractionQuestion, MultiplicationQuestion, DivisionQuestion} from "./QuestionModel.ts"
//import question view
export class QuestionController {
    private currentQuestion: Question | null = null;
    private wrong_questions: Question[] = [];
    //private view: QuestionView


    //Question generation factory  
    generateQuestion(levelId: number) : Question{
        let a: number; 
        let b: number;

        //Generates question object based upon current level and makes the 
        //current question the new object
        switch (levelId) {
            case 1:
                // 2-digit addition and subtraction.
                a = Math.floor(Math.random() *  90) + 10;  
                b = Math.floor(Math.random() *  90) + 10;
                if(Math.random() < 0.5){
                    this.currentQuestion = new AdditionQuestion(a,b);
                }
                else {
                    this.currentQuestion = new SubtractionQuestion(a, b);
                }
                break;
            case 2:
                // Multiplication with factors up to 9.
                a = Math.floor(Math.random() *  9) + 1;  
                b = Math.floor(Math.random() *  9) + 1;
                this.currentQuestion = new MultiplicationQuestion(a, b);
                break;
            case 3:
                // Division up to factors up to 9  
                a = Math.floor(Math.random() * 9) + 1;

                const factors = [];
                for (let i = 1; i <= a; i++) {
                    if (a % i === 0) {
                        factors.push(i);
                    }
                }

                b = factors[Math.floor(Math.random() * factors.length)];

                this.currentQuestion = new DivisionQuestion(a, b);

                break;
            case 4:
                //2-digit Multiplication with factors up to 25
                a = Math.floor(Math.random() *  25) + 1;  
                b = Math.floor(Math.random() *  25) + 1;
                
                this.currentQuestion = new MultiplicationQuestion(a,b);

                break;
            case 5:
                //2-digit division having answers from 1 to 10
                do {
                    b = Math.floor(Math.random() * 10) + 1;
                    const multiplier = Math.floor(Math.random() * 10) + 1;
                    a = b * multiplier;
                } while (a < 10 || a > 99);

                this.currentQuestion = new DivisionQuestion(a, b);
                break;
            default:
                throw new Error("Invalid Id");
        }
        return this.currentQuestion;
    }  
    //Access recently generated question
    getCurrentQuestion(): Question | null {
        return this.currentQuestion;
    }

    return isCorrect;
  }

  //Compares answer that will be entered by user from view with the correct answer.
  checkAnswer(question: Question, input: string): boolean {
    const userAnswer = Number(input);

    //checks if input was not a number
    if (Number.isNaN(userAnswer) || input.trim() === "") {
      return false;
    }

    //compares user answer with actual answer
    if (userAnswer === this.currentQuestion.answer) {
      return true;
    } else {
      return false;
    }
  }

  // Fuction to handle answer submission event
  //Check input with answer from question object
  private checkAnswerInput(answer: string): void {
    //Checks if the current question was never generated
    if (this.currentQuestion === null) {
      return;
    }

    const isCorrect = this.checkAnswer(this.currentQuestion, answer);

    if (isCorrect) {
      //update streak, questions correct
    } else {
      //reset streak, add to wrong_questions
      this.wrong_questions.push(this.currentQuestion);
    }
    //this.view.feedback.text(isCorrect ? '✓ Correct!' : '✗ Wrong, try again');
    //this.view.feedback.fill(isCorrect ? 'green' : 'crimson');
  }
}

export class WordProblemAdapter extends QuestionController {

  private adaptee: QuestionController;

    
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
  constructor(adaptee: QuestionController) {
    super();
    this.adaptee = adaptee;
  }

  public generateWordProblem(q_type?: string): Question {
    // Generate a random question type
    const q_types = ["addition", "subtraction", "multiplication", "division"];
    const target_type = q_type || q_types[Math.floor(Math.random() * q_types.length)];

    const baseQuestion = this.adaptee.generateQuestion(target_type);
    const a = (baseQuestion as any).a;
    const b = (baseQuestion as any).b;

    const templates = WORD_PROBLEM_TEMPLATES[target_type];
    if (!templates || templates.length === 0) {
      throw new Error(
        `No templates available for question type: ${target_type}`,
      );
    }
    const randomTemplate =
      templates[Math.floor(Math.random() * templates.length)];
    const wordProblemText = randomTemplate
      .replace("{a}", a.toString())
      .replace("{b}", b.toString());

    baseQuestion.text = wordProblemText;

    return baseQuestion;
  }

  public generateMultipleWordProblems(
    q_type: string,
    count: number,
  ): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push(this.generateWordProblem(q_type));
    }
    return questions;
  }
}
