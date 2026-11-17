import type { Question } from './QuestionModel';
import type { AnswerChoices, DistractorStrategy, Operation } from './DistractorModel';
import { OPERATIONS, SIGNS, DEFAULT_STRATEGIES, isValidDistractor } from './DistractorModel';

// Cap on random top-up attempts so generation can never loop forever
const MAX_ATTEMPTS = 100;

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
  genAnswerChoices(question: Question, numChoices: number): AnswerChoices {
    const choices = this.shuffle([question.answer, ...this.genIncorrectAnswers(question, numChoices-1)]);
    return { choices, correctIndex: choices.indexOf(question.answer)};
  }

  // Generate incorrect answers for a given problem
  // count is the number of wrong answers wanted
  genIncorrectAnswers(question: Question, count: number): number[] {
    const distractors = new Set<number>();

    // 1. Plausible mistakes from the strategies, in random order
    const candidates = this.shuffle(this.strategies.flatMap(s => s(question)));
    for (const n of candidates) {
      if (distractors.size >= count) break;
      if (isValidDistractor(n, question, distractors)) distractors.add(n);
    }

    // 2. Top up with random nearby values
    for (let attempts = 0; distractors.size < count && attempts < MAX_ATTEMPTS; attempts++) {
      const n = this.randomOffset(question.answer);
      if (isValidDistractor(n, question, distractors)) distractors.add(n);
    }

    // 3. Guaranteed fallback: walk upward from the answer until we have enough
    for (let n = Math.max(0, Math.ceil(question.answer) + 1); distractors.size < count; n++) {
      if (isValidDistractor(n, question, distractors)) distractors.add(n);
    }

    return [...distractors];
  }
}