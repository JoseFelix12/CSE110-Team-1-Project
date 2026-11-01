

export interface Question {
    //type: "plain" | "word";
    text: string;
    a: number;
    b: number;
    answer: number;
}

export class AdditionQuestion extends Question{
    constructor( a: number, b: number){
        this.text = "${a} + ${b}?";
        this.a = a;
        this.b = b;
        this.answer = a + b;
    }
}

export class SubtractionQuestion extends Question{
    constructor( a: number, b: number){
        this.text = "${a} - ${b}?";
        this.a = a;
        this.b = b;
        this.answer = a - b;
    }
}

export class MultiplicationQuestion extends Question{
    constructor( a: number, b: number){
        this.text = "${a} x ${b}?";
        this.a = a;
        this.b = b;
        this.answer = a * b;
    }
}

export class DivisionQuestion extends Question{
    constructor(a: number, b: number){
        this.text = "${a} ÷ ${b}?";
        this.a = a;
        this.b = b;
        this.answer = a / b;
    }
}

export const wrong_questions: Question[] = [];