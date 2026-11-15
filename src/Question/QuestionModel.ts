
//Skeleton for questions
export interface Question {
  //type: "plain" | "word";
  text: string;
  a: number;
  b: number;
  answer: number;
  operator: "addition" | "subtraction" | "division" | "multiplication"
}

export class AdditionQuestion implements Question {
  text: string;
  a: number;
  b: number;
  answer: number;
  operator: "addition" = "addition";

  constructor(a: number, b: number) {
    this.text = `${a} + ${b}?`;
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
  operator: "subtraction" = "subtraction";
  constructor(a: number, b: number) {
    this.text = `${a} - ${b}?`;
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
  operator: "multiplication" = "multiplication";
  constructor(a: number, b: number) {
    this.text = `${a} x ${b}?`;
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
  operator: "division" = "division";
    constructor(a: number, b: number){
        this.text = `${a} ÷ ${b}?`;
        this.a = a;
        this.b = b;
        this.answer = a / b;
    }
}

