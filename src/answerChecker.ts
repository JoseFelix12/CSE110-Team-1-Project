


export interface Answerable {
    a: number,
    b: number,
    operator: string
}

export function computeCorrectAnswer(question: Answerable): number {
    const { a, b, operator } = question;
    
    switch (operator) {
        case '+':
            return a + b;
        case '-':
            return a - b;
        case '*':
            return a * b;
        case '/':
            if (b == 0) {
                throw new Error('Division by zero');
            }
            if (a % b !== 0) {
                throw new Error('Non-integer division');
            }
            return a / b;
        default:
            throw new Error('Invalid operator');
    }
}


export function parseInput(input: unknown): number | null {
    if (typeof input === 'number') {
        return input;
    }
    if (typeof input === 'string') {
        const parsed = parseFloat(input);
        if (!isNaN(parsed)) {
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
    if (typeof input !== 'number') {
        return false;
    }
    
    if (userAnswer === expectedAnswer) {
        return true;
    } else {
        return false;
    }
}