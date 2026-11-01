import type { SkinColor, Upgrade } from "./gameConfig";

export interface CarData {
    color: SkinColor;
    upgrades: Upgrade[];
    cosmetics: string[]; 
    damage: number;   
}

export class Car {

    private data: CarData;

    constructor (data: CarData) {
        this.data = data;
    }

    public getColor(): SkinColor {
        return this.data.color;
    }

    public getUpgrades(): Upgrade[] {
        return this.data.upgrades;
    }

    public getCosmetics(): string[] {
        return this.data.cosmetics;
    }

    public getDamage(): number {
        return this.data.damage;
    }

}