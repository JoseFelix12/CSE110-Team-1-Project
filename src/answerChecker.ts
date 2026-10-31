export interface Answerable {
  a: number;
  b: number;
  operator: string;
}

export function computeCorrectAnswer(question: Answerable): number {
  const { a, b, operator } = question;

  switch (operator) {
    case "*":
      return a * b;
    case "/":
      if (b == 0) {
        throw new Error("Division by zero");
      }
      if (a % b !== 0) {
        throw new Error("Non-integer division");
      }
      return a / b;
    default:
      throw new Error("Invalid operator");
  }
}

export function parseInput(input: unknown): number | null {
  if (typeof input === "number") {
    let result;
    if (Number.isFinite(input)) {
      result = input;
    } else {
      return null;
    }
    return result;
  }
  if (typeof input === "string" && input.trim() !== "") {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function checkAnswer(question: Answerable, input: unknown): boolean {
  const userAnswer = parseInput(input);
  const expectedAnswer = computeCorrectAnswer(question);

  if (userAnswer === null) {
    return false;
  }

  if (userAnswer === expectedAnswer) {
    return true;
  } else {
    return false;
  }
}
