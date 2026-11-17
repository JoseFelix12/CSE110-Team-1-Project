import { Car }  from './Car';
import { HEALTH_REPAIR } from '../constants';
import type { Question } from '../Question/QuestionModel';
import { QuestionController, WordProblemAdapter } from '../Question/QuestionController';
import { DistractorController } from '../Question/DistractorController';
import type { AnswerChoices } from '../Question/DistractorModel';

// Question levels the repair minigame draws from (covers +, -, x, ÷)
const MIN_LEVEL = 1;
const MAX_LEVEL = 5;

export class RepairMinigame {

    private car: Car;
    private adapter: WordProblemAdapter;
    private distractors: DistractorController;

    // Constructor
    constructor(car: Car = new Car(), distractors: DistractorController = new DistractorController()) {
        this.car = car;
        this.adapter = new WordProblemAdapter(new QuestionController());
        this.distractors = distractors;
    }

    // Get car status
    public getCarStatus(): number {
        return this.car.getHealth();
    }

    // Fix car health
    public fixCar(amount: number = HEALTH_REPAIR): void {
        this.car.undoDamage(amount);
    }

    // Word problem generator; picks a random level (1-5) when none is given
    public generateQuestion(levelId: number = this.randomLevel()): Question {
        return this.adapter.generateWordProblem(levelId);
    }

    // Question Answer Checker
    public checkAnswer(question: Question, input: string): boolean {
        return this.adapter.checkAnswer(question, input);
    }

    // Shuffled answer choices (1 correct + numChoices-1 distractors)
    public generateAnswerChoices(question: Question, numChoices: number = 4): AnswerChoices {
        return this.distractors.genAnswerChoices(question, numChoices);
    }

    private randomLevel(): number {
        return Math.floor(Math.random() * (MAX_LEVEL - MIN_LEVEL + 1)) + MIN_LEVEL;
    }

}