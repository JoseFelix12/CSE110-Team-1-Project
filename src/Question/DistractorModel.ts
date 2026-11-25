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

export const MIN_OFFSET = 25;
export const OFFSET_RANGE = 50;

export type DistractorStrategy = (q: Question) => number[];
export const wrongOperation: DistractorStrategy = q => [q.a + q.b, q.a - q.b, q.a * q.b, q.a / q.b];
export const squared: DistractorStrategy = q => {
    const sq = q.answer * q.answer;
    return [sq > 100 ? q.answer * 2 : sq]; // fallback to doubling it when the square would be > 100
};
export const offByRandom: DistractorStrategy = (q) => [
    q.answer + Math.floor(Math.random()*(OFFSET_RANGE+1))+MIN_OFFSET, 
    q.answer - Math.floor(Math.random()*(OFFSET_RANGE+1))+MIN_OFFSET
];
export const DEFAULT_STRATEGIES: DistractorStrategy[] = [wrongOperation, squared, offByRandom];

export function isValidDistractor(n: number, q: Question, existing: Set<number>): boolean {
    return Number.isInteger(n) && n >= 0 && n!== q.answer && !existing.has(n);
}