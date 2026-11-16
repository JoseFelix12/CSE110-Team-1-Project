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

export type DistractorStrategy = (q: Question) => number[];
export const wrongOperation: DistractorStrategy = q => [q.a + q.b, q.a - q.b, q.a * q.b, q.a / q.b];
export const offByOne: DistractorStrategy = q => [q.answer+1, q.answer-1];
export const squared: DistractorStrategy = q => [Math.pow(q.answer, 2)];
export const DEFAULT_STRATEGIES: DistractorStrategy[] = [wrongOperation, offByOne, squared];

export function isValidDistractor(n: number, q: Question, existing: Set<number>): boolean {
    return Number.isInteger(n) && n >= 0 && n!== q.answer && !existing.has(n);
}