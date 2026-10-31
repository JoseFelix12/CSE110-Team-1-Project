//TODO create word questions but that is not a priority right now

export interface Question {
    id: number,
    type: "plain" | "word",
    text: string,
    a: number,
    b: number,
    operator: string
}


export interface questionGenerator {
    operators: string[], //which operators to use so should be ["*", "/"]
    min: number, //smallest number 
    max: number,
}


function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class QuestionGenerator {
    private config: questionGenerator;
    private nextID = 1;
    constructor(config: questionGenerator) {
        if (!Number.isInteger(config.min) || !Number.isInteger(config.max)) {
            throw new Error('Min and max must be integers');
        }
        if (config.operators.length === 0) {
            throw new Error('At least one operator must be specified');
        }
        for (const operators of config.operators) {
            if (operators != '*' && operators != '/') {
                throw new Error(`Invalid operator: ${operators}`);
            }
            
        }
        if (config.min < 0 || config.max < config.min) {
            throw new Error('Need 0 <= min <= max');
        }
        if (config.max < 1) {
            throw new Error("Max must be at least 1 (we cannot divide by 0)");
        }
        this.config = config;

    }

    //makes one new question
    nextQuestion(): Question {
        const question = this.makeQuestion(this.nextID);
        this.nextID++;
        return question;
    }

    // makes count questions and returns them in an array
    generate(count: number): Question[] {
        if (!Number.isInteger(count) || count <= 0) {
            throw new Error('Count must be a positive integer');
        }


        const questions: Question[] = [];
        while (questions.length < count) {
            questions.push(this.nextQuestion());
        }
        return questions;


    }

    //the core part of this part. 
    private makeQuestion(id: number): Question {
        const { operators, min, max } = this.config;
        const operator = operators[randomInt(0, operators.length - 1)];
        let a: number;
        let b: number;

        if (operator === '*') {
            a = randomInt(min, max);
            b = randomInt(min, max);
        } else if (operator === '/') {
            b = randomInt(Math.max(min, 1), max);
            const answer = randomInt(min,max);

            a = b * answer; 
        } else {
            throw new Error(`Invalid operator: ${operator}`);
        }

        let symbol;
        if (operator == '*') {
            symbol = '×';
        } else if (operator == '/') {
            symbol = '÷';
        } else {
            throw new Error(`Invalid operator: ${operator}`);
        }

        const text = `${a} ${symbol} ${b} = ?`;
        return { id, type: "plain", text, a, b, operator };
    }
}
//factory function to create a question generator
export function createQuestionGenerator(
  config: questionGenerator,
): QuestionGenerator {
  return new QuestionGenerator(config);
}
