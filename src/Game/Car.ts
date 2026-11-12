import type { SkinColor, Upgrade } from "./gameConfig.ts";
import { DEFAULT_SKIN, ENGINE_SPEED_BONUS_PER_LEVEL, MAX_HEALTH, SKIN_PRICES } from './gameConfig.ts';

export interface CarData {
    skin: SkinColor;
    engineLevel: number;
    speedMultiplier: number;
    upgrades: Upgrade[];
    cosmetics: string[]; 
    health: number;   
}

export interface ReadonlyCar {
    getSkin(): SkinColor;
    getEngineLevel(): number;
    getSpeedMultiplier(): number;
    getUpgrades(): Upgrade[];
    getCosmetics(): string[];
    getHealth(): number;
}

export class Car implements ReadonlyCar {

    private data: CarData;

    constructor (data: CarData = Car.defaultData()) {
        this.data = structuredClone(data);
    }

    /**
     * Provide default data
     */
    static defaultData(): CarData {
        return {
            skin: DEFAULT_SKIN,
            engineLevel: 0,
            speedMultiplier: 1,
            upgrades: [],
            cosmetics: [],
            health: MAX_HEALTH
        }
    }

    /**
     * Builds a car from untrusted data
     */
    static fromSave(raw: Partial<CarData> | undefined): Car {
        const defaultCar = Car.defaultData();
        return new Car({
            skin: raw?.skin && raw.skin in SKIN_PRICES ? raw.skin : defaultCar.skin,
            engineLevel: typeof raw?.engineLevel === 'number' ? raw.engineLevel : defaultCar.engineLevel,
            speedMultiplier: typeof raw?.speedMultiplier === 'number' ? raw.speedMultiplier : defaultCar.speedMultiplier,
            upgrades: Array.isArray(raw?.upgrades) ? raw.upgrades : defaultCar.upgrades,
            cosmetics: Array.isArray(raw?.cosmetics) ? raw.cosmetics : defaultCar.cosmetics,
            health: typeof raw?.health === 'number' ? raw.health : defaultCar.health
        });
    }

    /* Getter functions */

    /*
     * Get the skin color of the car
     */
    public getSkin(): SkinColor {
        return this.data.skin;
    }

    /*
     * Get the upgrades of the car 
     */
    public getUpgrades(): Upgrade[] {
        return [...this.data.upgrades];
    }

    /**
     * Get the cosmetics of the car
     */
    public getCosmetics(): string[] {
        return [...this.data.cosmetics];
    }

    /**
     * Get the car engine's level
     */
    public getEngineLevel(): number {
        return this.data.engineLevel;
    }

    /**
     * Get the car's speed multiplier
     */
    public getSpeedMultiplier(): number {
        return this.data.speedMultiplier;
    }

    /**
     * Get the health inflicted on the car
     */
    public getHealth(): number {
        return this.data.health;
    }

    /* Setter functions */

    /**
     * Set the color of the car
     */
    public setColor(skin: SkinColor): void {
        this.data.skin = skin;
    }

    public upgradeEngine(): void {
        this.data.engineLevel++;
    }

    /**
     * Update the speed multiplier of the car.
     * Should be called when the engine level changes.
     */
    public updateSpeedMultiplier(): void {
        this.data.speedMultiplier = 1 + this.data.engineLevel * ENGINE_SPEED_BONUS_PER_LEVEL;
    }

    /* Do and undo damage */

    /**
     * Add damage to the car, floored at 0.
     * Throws if amount is negative or NaN.
     */
    public inflictDamage(amount: number): void {
        Car.assertValidAmount(amount);
        this.data.health = Math.max(0, this.getHealth() - amount);
    }

    /**
     * Remove damage from the car, capped at MAX_HEALTH.
     * Throws if amount is negative or NaN.
     */
    public undoDamage(amount: number): void {
        Car.assertValidAmount(amount);
        this.data.health = Math.min(MAX_HEALTH, this.getHealth() + amount);
    }

    private static assertValidAmount(amount: number): void {
        if (Number.isNaN(amount) || amount < 0) {
            throw new RangeError(`Damage amount must be a non-negative number, got ${amount}`);
        }
    }

    public toJSON(): CarData {
        return structuredClone(this.data);
    }

}