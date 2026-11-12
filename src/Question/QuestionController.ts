import {
  type Question,
  AdditionQuestion,
  SubtractionQuestion,
  MultiplicationQuestion,
  DivisionQuestion,
} from "./QuestionModel.ts";
import { WORD_PROBLEM_TEMPLATES } from "../constants.ts";
//import question view
export class QuestionController {
  private currentQuestion: Question | null = null;
  private wrong_questions: Question[] = [];
  //private view: QuestionView

  //Question generation factory
  generateQuestion(q_type: string): Question {
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;

    //Generates question object based upon chosen type and makes the
    //current question the new object
    switch (q_type) {
      case "addition":
        this.currentQuestion = new AdditionQuestion(a, b);
        break;
      case "subtraction":
        this.currentQuestion = new SubtractionQuestion(a, b);
        break;
      case "multiplication":
        this.currentQuestion = new MultiplicationQuestion(a, b);
        break;
      case "division":
        //Recalculates a to be divisible by b
        a = b * (Math.floor(Math.random() * 10) + 1);
        this.currentQuestion = new DivisionQuestion(a, b);
        break;
      default:
        throw new Error("Invalid question type");
    }
    return this.currentQuestion;
  }

  generateMultipleQuestions(q_type: string, count: number): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push(this.generateQuestion(q_type));
    }
    return questions;
  }

  //Access recently generated question
  getCurrentQuestion(): Question | null {
    return this.currentQuestion;
  }

  // Returns missed questions
  getWrongQuestions(): Question[] {
    return [...this.wrong_questions];
  }
  //Simple version of checkAnswerInput that checks answer input for tests
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

class WordProblemAdapter extends QuestionController {

  private adaptee: QuestionController;

  constructor(adaptee: QuestionController) {
    super();
    this.adaptee = adaptee;
  }

  public generateWordProblem(q_type?: string): Question {
    // Generate a random question type
    const q_types = ["addition", "subtraction", "multiplication", "division"];
    const target_type =
      q_type || q_types[Math.floor(Math.random() * q_types.length)];

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

    return this.adaptee.generateQuestion(target_type);
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
