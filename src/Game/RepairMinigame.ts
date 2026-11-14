import { Car }  from './Car';
import { HEALTH_REPAIR } from '../constants';
import type { Question } from '../Question/QuestionModel';
import { QuestionController, WordProblemAdapter } from '../Question/QuestionController';

export class RepairMinigame {

    private car: Car;
    private adapter: WordProblemAdapter;

    // Constructor
    constructor(car: Car = new Car()) {
        this.car = car;
        this.adapter = new WordProblemAdapter(new QuestionController());
    }   

    // Get car status
    public getCarStatus(): number {
        return this.car.getHealth();
    }

    // Fix car health
    public fixCar(amount: number = HEALTH_REPAIR): void {
        this.car.undoDamage(amount);
    }

    // Question Generator
    public generateQuestion(type: string): Question {
        return this.adapter.generateWordProblem(type);
    }

}