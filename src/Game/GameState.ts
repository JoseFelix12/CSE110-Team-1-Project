import { Car } from './Car.ts';
import type { CarData, ReadonlyCar } from './Car.ts';
import {
    COINS_PER_CORRECT_ANSWER,
    COINS_PER_STAR,
    DEFAULT_SKIN,
    ENGINE_UPGRADE_PRICES,
    LEVELS,
    SKIN_PRICES,
    STARS_TO_UNLOCK_NEXT,
    STAR_THRESHOLDS,
} from './gameConfig.ts';
import type { LevelConfig, SkinColor } from './gameConfig.ts';

/** Minimal storage interface so tests can pass a fake instead of localStorage */
export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

/** Everything that gets saved between sessions */
interface Progress {
    coins: number;
    /** Best stars earned per level id */
    stars: Record<number, number>;
    ownedSkins: SkinColor[];
}

/* Fields that older saves keep, even if there is no car object yet */
interface LegacySaveFields {
    engineLevel?: number;
    selectedSkin?: SkinColor;
}

export interface SaveData extends Progress {
    car: CarData;
}

/** A level plus the player's progress on it, for LevelSelectScreen */
export interface LevelStatus extends LevelConfig {
    stars: number;
    unlocked: boolean;
}

export interface RaceResult {
    stars: number;
    coinsEarned: number;
    /** True if this race beat the previous best stars on the level */
    newBest: boolean;
    /** Id of a level this race unlocked, if any */
    unlockedLevelId: number | null;
}

export type GameStateListener = (state: GameState) => void;

export const SAVE_KEY = 'mathRacer.save';

function defaultProgress(): Progress {
    return {
        coins: 0,
        stars: {},
        ownedSkins: [DEFAULT_SKIN]
    };
}

function getDefaultStorage(): StorageLike | null {
    try {
        return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
        return null;
    }
}

/**
 * Converts race accuracy into 0-3 stars
 */
export function calculateStars(correct: number, total: number): number {
    if (total <= 0) {
        return 0;
    }
    const accuracy = correct / total;
    return STAR_THRESHOLDS.filter((threshold) => accuracy >= threshold).length;
}

/**
 * GameState - Player progress across the whole game (levels, stars, coins, shop).
 * Screens read from it and subscribe() to re-render when it changes.
 * Saves automatically after every change.
 */
export class GameState {
    private data: Progress;
    private storage: StorageLike | null;
    private listeners = new Set<GameStateListener>();
    private car: Car;

    constructor(storage: StorageLike | null = getDefaultStorage()) {
        this.storage = storage;
        const { car, ...progress } = this.load();
        this.data = progress;
        this.car = new Car(car);
    }

    getCar(): ReadonlyCar {
        return this.car;
    }

    // ---------- Levels ----------

    /**
     * Gets every level with its stars and locked/unlocked status
     */
    getLevels(): LevelStatus[] {
        return LEVELS.map((level) => ({
            ...level,
            stars: this.getStars(level.id),
            unlocked: this.isLevelUnlocked(level.id),
        }));
    }

    /**
     * Gets the config for one level
     */
    getLevel(levelId: number): LevelConfig {
        const level = LEVELS.find((l) => l.id === levelId);
        if (!level) {
            throw new Error(`Level ${levelId} does not exist`);
        }
        return level;
    }

    /**
     * Level 1 is always unlocked; others need enough stars on the level before
     */
    isLevelUnlocked(levelId: number): boolean {
        const index = LEVELS.findIndex((l) => l.id === levelId);
        if (index === -1) {
            return false;
        }
        if (index === 0) {
            return true;
        }
        return this.getStars(LEVELS[index - 1].id) >= STARS_TO_UNLOCK_NEXT;
    }

    /**
     * Gets the best stars earned on a level
     */
    getStars(levelId: number): number {
        return this.data.stars[levelId] ?? 0;
    }

    /**
     * Gets the stars earned across all levels
     */
    getTotalStars(): number {
        return LEVELS.reduce((sum, level) => sum + this.getStars(level.id), 0);
    }

    /**
     * Gets the highest unlocked level, which the hub can use as a "Continue" button
     */
    getCurrentLevelId(): number {
        const unlocked = LEVELS.filter((l) => this.isLevelUnlocked(l.id));
        return unlocked[unlocked.length - 1].id;
    }

    /**
     * Records a finished race: awards coins, keeps best stars, unlocks the next level
     */
    recordRaceResult(levelId: number, correct: number, total: number): RaceResult {
        this.getLevel(levelId);
        if (!this.isLevelUnlocked(levelId)) {
            throw new Error(`Level ${levelId} is locked`);
        }

        const stars = calculateStars(correct, total);
        const previousStars = this.getStars(levelId);
        const lockedBefore = LEVELS.filter((l) => !this.isLevelUnlocked(l.id)).map((l) => l.id);

        const newBest = stars > previousStars;
        if (newBest) {
            this.data.stars[levelId] = stars;
        }
        const coinsEarned = correct * COINS_PER_CORRECT_ANSWER + stars * COINS_PER_STAR;
        this.data.coins += coinsEarned;

        const unlockedLevelId = lockedBefore.find((id) => this.isLevelUnlocked(id)) ?? null;

        this.changed();
        return { stars, coinsEarned, newBest, unlockedLevelId };
    }

    // ---------- Coins ----------

    getCoins(): number {
        return this.data.coins;
    }

    /**
     * Adds coins, e.g. as a mini-game reward
     */
    addCoins(amount: number): void {
        if (amount <= 0) {
            return;
        }
        this.data.coins += amount;
        this.changed();
    }

    /**
     * Spends coins if the player has enough. Returns whether it worked.
     */
    spendCoins(amount: number): boolean {
        if (amount < 0 || amount > this.data.coins) {
            return false;
        }
        this.data.coins -= amount;
        this.changed();
        return true;
    }

    // ---------- Shop: engine ----------

    /**
     * Gets the price of the next engine upgrade, or null when maxed out
     */
    getNextEngineUpgradePrice(): number | null {
        return ENGINE_UPGRADE_PRICES[this.car.getEngineLevel()] ?? null;
    }

    /**
     * Buys the next engine upgrade. Returns whether it worked.
     */
    buyEngineUpgrade(): boolean {
        const price = this.getNextEngineUpgradePrice();
        if (price === null || price > this.data.coins) {
            return false;
        }
        this.data.coins -= price;
        this.car.upgradeEngine();
        this.car.updateSpeedMultiplier();
        this.changed();
        return true;
    }

    // ---------- Shop: skins ----------

    getOwnedSkins(): SkinColor[] {
        return [...this.data.ownedSkins];
    }

    ownsSkin(skin: SkinColor): boolean {
        return this.data.ownedSkins.includes(skin);
    }

    /**
     * Buys a skin and equips it. Returns whether it worked.
     */
    buySkin(skin: SkinColor): boolean {
        const price = SKIN_PRICES[skin];
        if (price === undefined || this.ownsSkin(skin) || price > this.data.coins) {
            return false;
        }
        this.data.coins -= price;
        this.data.ownedSkins.push(skin);
        this.car.setColor(skin);
        this.changed();
        return true;
    }

    /**
     * Equips a skin the player already owns. Returns whether it worked.
     */
    selectSkin(skin: SkinColor): boolean {
        if (!this.ownsSkin(skin)) {
            return false;
        }
        this.car.setColor(skin);
        this.changed();
        return true;
    }

    // ---------- Listeners / saving ----------

    /**
     * Calls listener whenever the state changes. Returns an unsubscribe function.
     */
    subscribe(listener: GameStateListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Wipes all progress
     */
    reset(): void {
        this.data = defaultProgress();
        this.car = new Car();
        this.changed();
    }

    /**
     * Gets a copy of the save data (for debugging or tests)
     */
    toJSON(): SaveData {
        return { ...structuredClone(this.data), car: this.car.toJSON() };
    }

    private changed(): void {
        this.save();
        this.listeners.forEach((listener) => listener(this));
    }

    private save(): void {
        try {
            this.storage?.setItem(SAVE_KEY, JSON.stringify(this.toJSON()));
        } catch {
            // Storage full or blocked; progress still lives in memory
        }
    }

    private load(): SaveData {
        const fallback: SaveData = { ...defaultProgress(), car: Car.defaultData() };
        let raw: string | null = null;
        try {
            raw = this.storage?.getItem(SAVE_KEY) ?? null;
        } catch {
            return fallback;
        }
        if (!raw) {
            return fallback;
        }
        try {
            const parsed = JSON.parse(raw) as Partial<SaveData> & LegacySaveFields;
            const ownedSkins = Array.isArray(parsed.ownedSkins)
                ? parsed.ownedSkins.filter((s): s is SkinColor => s in SKIN_PRICES)
                : fallback.ownedSkins;
            if (!ownedSkins.includes(DEFAULT_SKIN)) {
                ownedSkins.unshift(DEFAULT_SKIN);
            }

            const car = Car.fromSave(parsed.car ?? {
                skin: parsed.selectedSkin,
                engineLevel: parsed.engineLevel,
            });
            return {
                coins: typeof parsed.coins === 'number' ? parsed.coins : fallback.coins,
                stars: parsed.stars && typeof parsed.stars === 'object' ? parsed.stars : fallback.stars,
                ownedSkins,
                car: car.toJSON()
            };
        } catch {
            return fallback;
        }
    }
}
