import type { Question } from './QuestionModel';
import type { AnswerChoices, DistractorStrategy, Operation } from './DistractorModel';
import { OPERATIONS, SIGNS, DEFAULT_STRATEGIES, isValidDistractor } from './DistractorModel';

export class DistractorController {

  private rng: () => number;
  private strategies: DistractorStrategy[];
  private maxOffset: number;

  constructor(
    rng: () => number = Math.random,
    strategies: DistractorStrategy[] = DEFAULT_STRATEGIES,
    maxOffset: number = 0.2 // Percentage offset
  ) {
    this.rng = rng;
    this.strategies = strategies;
    this.maxOffset = maxOffset;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Picks one operation at random from the given list
  randomOperation(ops: readonly Operation[] = Object.keys(OPERATIONS) as Operation[]): Operation {
    return ops[Math.floor(this.rng() * ops.length)];
  }

  // Random sign: '+' or '-' with equal probability
  randomSign(): Operation {
    return this.randomOperation(SIGNS);
  }

  // Nudges the answer up or down by 1...(maxOffset * answer), never by 0.
  // e.g. answer 50, maxOffset 0.2 -> answer ± (1..10)
  randomOffset(answer: number): number {
    const sign = this.randomSign();
    const maxStep = Math.max(1, Math.round(Math.abs(answer) * this.maxOffset));
    const step = Math.floor(this.rng() * maxStep) + 1;
    return OPERATIONS[sign](answer, step);
  }

  // Generate all answer choices for a given problem
  genAnswerChoices(question: Question, numChoices: number): number[] {
    return [];
  }

  // Generate incorrect answers for a given problem
  genIncorrectAnswers(question: Question): number[] {
    return [];
  }
}