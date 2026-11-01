import { Car }  from './Car';

export class RepairMinigame {

    private car: Car;

    // Constructor
    constructor(car: Car) {
        this.car = car;
    }   

    // Get car status
    public getCarStatus(): number {
        return this.car.getDamage();
    }

    // Question Generator

}