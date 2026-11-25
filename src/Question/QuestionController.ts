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

  private levelOneQuestion(): Question {
    // 2-digit addition and subtraction.
    const a = Math.floor(Math.random() * 40) + 10;
    const b = Math.floor(Math.random() * 40) + 10;
    if (Math.random() < 0.5) {
      return new AdditionQuestion(a, b);
    } else {
      // Larger number first so answers (and word problems) never go negative
      return new SubtractionQuestion(Math.max(a, b), Math.min(a, b));
    }
  }


  private levelTwoQuestion(): Question {
    // Multiplication with factors up to 12.
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        return new MultiplicationQuestion(a, b);
  }

  private levelThreeQuestion(): Question {
    // Division with answers from 1 to 9.
        const quotient = Math.floor(Math.random() * 9) + 1;
        const divisor = Math.floor(Math.random() * 9) + 1;

        const a = quotient * divisor;
        const b = divisor;
        return new DivisionQuestion(a, b);
  }

  private levelFourQuestion(): Question {
    // 2-digit by 1-digit multiplication with factors from 10 to 25.
        const a = Math.floor(Math.random() * 16) + 10; // 10 to 25
        const b = Math.floor(Math.random() * 9) + 1;   // 1 to 9
        return new MultiplicationQuestion(a, b);
  }

  //Generates question object based upon current level
  private questionForLevel(levelId: number): Question {

    switch (levelId) {
      case 1:
        // 2-digit addition and subtraction.
        return this.levelOneQuestion();
      case 2:
        // Multiplication with factors up to 12.
        return this.levelTwoQuestion();
      case 3: {
        return this.levelThreeQuestion();
      }
      case 4:
        //2-digit by 1-digit Multiplication with factors from 10 to 25
        return this.levelFourQuestion();
      case 5:
        //Combination of level 3 and 4 
        
        if (Math.random() < 0.5) {
          return this.levelThreeQuestion();
        } else {
          return this.levelFourQuestion();
        }
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
