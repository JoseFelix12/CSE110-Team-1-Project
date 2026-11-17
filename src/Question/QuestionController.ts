import {
  type Question,
  AdditionQuestion,
  SubtractionQuestion,
  MultiplicationQuestion,
  DivisionQuestion,
} from "./QuestionModel.ts";
import { WORD_PROBLEM_TEMPLATES } from "../constants.ts";

export type QuestionType = 'addition' | 'subtraction' | 'multiplication' | 'division';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//import question view
export class QuestionController {
  private currentQuestion: Question | null = null;
  private wrong_questions: Question[] = [];
  //private view: QuestionView

  //Question generation factory. Takes either a level id (1-5) or a question
  //type such as "addition". With a type, min and max are the smallest and
  //largest numbers used (e.g. 10 and 99 for 2 digit numbers)
  generateQuestion(kind: number | string, min = 1, max = 10): Question {
    this.currentQuestion =
      typeof kind === "number"
        ? this.questionForLevel(kind)
        : this.questionOfType(kind, min, max);
    return this.currentQuestion;
  }

  //Makes a question of the given type with numbers from min to max
  private questionOfType(q_type: string, min: number, max: number): Question {
    let a = randomInt(min, max);
    let b = randomInt(min, max);

    switch (q_type) {
      case 'addition':
        return new AdditionQuestion(a, b);
      case 'subtraction':
        //Bigger number first so the answer is never negative
        return new SubtractionQuestion(Math.max(a, b), Math.min(a, b));
      case 'multiplication':
        return new MultiplicationQuestion(a, b);
      case 'division':
        //Recalculates a to be divisible by b
        b = randomInt(Math.max(min, 1), max);
        a = b * randomInt(min, max);
        return new DivisionQuestion(a, b);
      default:
        throw new Error("Invalid question type");
    }
  }

  //Generates question object based upon current level
  private questionForLevel(levelId: number): Question {
    let a: number;
    let b: number;

    switch (levelId) {
      case 1:
        // 2-digit addition and subtraction.
        a = Math.floor(Math.random() * 90) + 10;
        b = Math.floor(Math.random() * 90) + 10;
        if (Math.random() < 0.5) {
          return new AdditionQuestion(a, b);
        }
        return new SubtractionQuestion(a, b);
      case 2:
        // Multiplication with factors up to 9.
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * 9) + 1;
        return new MultiplicationQuestion(a, b);
      case 3: {
        // Division up to factors up to 9
        a = Math.floor(Math.random() * 9) + 1;

        const factors = [];
        for (let i = 1; i <= a; i++) {
          if (a % i === 0) {
            factors.push(i);
          }
        }

        b = factors[Math.floor(Math.random() * factors.length)];
        return new DivisionQuestion(a, b);
      }
      case 4:
        //2-digit Multiplication with factors up to 25
        a = Math.floor(Math.random() * 25) + 1;
        b = Math.floor(Math.random() * 25) + 1;
        return new MultiplicationQuestion(a, b);
      case 5:
        //2-digit division having answers from 1 to 10
        do {
          b = Math.floor(Math.random() * 10) + 1;
          const multiplier = Math.floor(Math.random() * 10) + 1;
          a = b * multiplier;
        } while (a < 10 || a > 99);
        return new DivisionQuestion(a, b);
      default:
        throw new Error("Invalid Id");
    }
  }

  generateMultipleQuestions(ID: number, count: number): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push(this.generateQuestion(ID));
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
    return userAnswer === question.answer;
  }
}

export class WordProblemAdapter extends QuestionController {
  private adaptee: QuestionController;

  constructor(adaptee: QuestionController) {
    super();
    this.adaptee = adaptee;
  }

  public generateWordProblem(levelId: number | string): Question {
    const baseQuestion = this.adaptee.generateQuestion(levelId);
    const a = baseQuestion.a;
    const b = baseQuestion.b;

    const templates = WORD_PROBLEM_TEMPLATES[baseQuestion.operator];

    if (!templates || templates.length === 0) {
      throw new Error(`No templates available for: ${baseQuestion.operator}`);
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
    levelId: number,
    count: number,
  ): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push(this.generateWordProblem(levelId));
    }
    return questions;
  }
}
