

export interface Question {
  //type: "plain" | "word";
  text: string;
  a: number;
  b: number;
  answer: number;
}

export class AdditionQuestion implements Question {
  text: string;
  a: number;
  b: number;
  answer: number;

  constructor(a: number, b: number) {
    this.text = "${a} + ${b}?";
    this.a = a;
    this.b = b;
    this.answer = a + b;
  }
}

export class SubtractionQuestion implements Question {
  text: string;
  a: number;
  b: number;
  answer: number;

  constructor(a: number, b: number) {
    this.text = "${a} - ${b}?";
    this.a = a;
    this.b = b;
    this.answer = a - b;
  }
}

export class MultiplicationQuestion implements Question {
  text: string;
  a: number;
  b: number;
  answer: number;

  constructor(a: number, b: number) {
    this.text = "${a} x ${b}?";
    this.a = a;
    this.b = b;
    this.answer = a * b;
  }
}

export class DivisionQuestion implements Question {
  text: string;
  a: number;
  b: number;
  answer: number;

  constructor(a: number, b: number) {
    this.text = "${a} ÷ ${b}?";
    this.a = a;
    this.b = b;
    this.answer = a / b;
  }
}
export const wrong_questions: Question[] = [];