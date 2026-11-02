import type { SkinColor, Upgrade } from "./gameConfig.ts";
import { DEFAULT_SKIN, ENGINE_SPEED_BONUS_PER_LEVEL, MAX_DAMAGE, SKIN_PRICES } from './gameConfig.ts';

export interface CarData {
    skin: SkinColor;
    engineLevel: number;
    speedMultiplier: number;
    upgrades: Upgrade[];
    cosmetics: string[]; 
    damage: number;   
}

export interface ReadonlyCar {
    getSkin(): SkinColor;
    getEngineLevel(): number;
    getSpeedMultiplier(): number;
    getUpgrades(): Upgrade[];
    getCosmetics(): string[];
    getDamage(): number;
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
            damage: 0
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
            damage: typeof raw?.damage === 'number' ? raw.damage : defaultCar.damage
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
     * Get the damage inflicted on the car
     */
    public getDamage(): number {
        return this.data.damage;
    }

    /* Setter functions */

    /**
     * Set the color of the car
     */
    public setColor(skin: SkinColor): void {
        this.data.skin = skin;
    }

    /**
     * Set the cosmetics of the car
     */
    public setCosmetics(cosmetics: string[]): void {
        this.data.cosmetics = cosmetics;
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

    public inflictDamage(amount: number): void {
        this.data.damage = Math.min(MAX_DAMAGE, this.getDamage() + amount);
    }

    public undoDamage(amount: number): void {
        this.data.damage = Math.max(0, this.getDamage() - amount);
    }

    public toJSON(): CarData {
        return structuredClone(this.data);
    }

}