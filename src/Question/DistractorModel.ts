import type { Question } from './QuestionModel';

export interface AnswerChoices {
    choices: number[];
    correctIndex: number;
}

export const OPERATIONS = {
  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b,
} as const;

export type Operation = keyof typeof OPERATIONS;

// The two operations that act as a "sign"
export const SIGNS: readonly Operation[] = ['+', '-'];

export const MIN_OFFSET = 0.25;
export const MAX_OFFSET = 0.75;
export const OFFSET_RANGE = MAX_OFFSET - MIN_OFFSET;

export type DistractorStrategy = (q: Question, rng: () => number) => number[];
export const wrongOperation: DistractorStrategy = q => [q.a + q.b, q.a - q.b, q.a * q.b, q.a / q.b];
export const squared: DistractorStrategy = q => {
    const sq = q.answer * q.answer;
    return [sq > 100 ? q.answer * 2 : sq]; // fallback to doubling it when the square would be > 100
};
// Generate an incorrect answer 25% to 75% off of the correct answer
export const offByRandom: DistractorStrategy = (q, rng) => {
    const size = Math.abs(q.answer);
    const minStep = Math.max(1, Math.ceil(size * MIN_OFFSET));
    const maxStep = Math.max(minStep, Math.floor(size * MAX_OFFSET));
    const randomStep = () => minStep + Math.floor(rng() * (maxStep - minStep + 1));
    return [q.answer + randomStep(), q.answer - randomStep()];
};

export const DEFAULT_STRATEGIES: DistractorStrategy[] = [wrongOperation, squared, offByRandom];

export function isValidDistractor(n: number, q: Question, existing: Set<number>): boolean {
    return Number.isInteger(n) && n >= 0 && n!== q.answer && !existing.has(n);
}