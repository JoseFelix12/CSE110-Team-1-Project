import type { SkinColor, Upgrade } from "./gameConfig";
import { MAX_DAMAGE } from "./gameConfig";

export interface CarData {
    skin: SkinColor;
    upgrades: Upgrade[];
    cosmetics: string[]; 
    damage: number;   
}

export class Car {

    private data: CarData;

    constructor (data: CarData) {
        this.data = data;
    }

    /* Getter functions */

    public getSkin(): SkinColor {
        return this.data.skin;
    }

    public getUpgrades(): Upgrade[] {
        return [...this.data.upgrades];
    }

    public getCosmetics(): string[] {
        return [...this.data.cosmetics];
    }

    public getDamage(): number {
        return this.data.damage;
    }

    /* Setter functions */

    public setColor(skin: SkinColor) {
        this.data.skin = skin;
    }

    public setComsetics(cosmetics: string[]) {
        this.data.cosmetics = cosmetics;
    }

    /* Do and undo damage */

    public inflictDamage(amount: number) {
        this.data.damage = Math.min(MAX_DAMAGE, this.getDamage() + amount);
    }

    public undoDamage(amount: number) {
        this.data.damage = Math.max(0, this.getDamage() - amount);
    }

}