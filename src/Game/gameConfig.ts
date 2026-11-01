/**
 * gameConfig - Static data for levels and the shop.
 * Screens and the question generator read from here so every level
 * is defined in one place.
 */

export type Operator = '*' | '/';

export interface LevelConfig {
    id: number;
    name: string;
    description: string;
    /** Operators the question generator should use for this level */
    operators: Operator[];
    /** Largest factor used when building questions (e.g. 10 -> up to 10 x 10) */
    maxFactor: number;
    questionCount: number;
}

export const LEVELS: LevelConfig[] = [
    {
        id: 1,
        name: 'Rookie Raceway',
        description: 'Multiplication with factors up to 5.',
        operators: ['*'],
        maxFactor: 5,
        questionCount: 15,
    },
    {
        id: 2,
        name: 'Times Table Track',
        description: 'Multiplication with factors up to 10.',
        operators: ['*'],
        maxFactor: 10,
        questionCount: 15,
    },
    {
        id: 3,
        name: 'Division Drift',
        description: 'Division facts up to 10.',
        operators: ['/'],
        maxFactor: 10,
        questionCount: 15,
    },
    {
        id: 4,
        name: 'Grand Prix',
        description: 'Mixed multiplication and division up to 12.',
        operators: ['*', '/'],
        maxFactor: 12,
        questionCount: 20,
    },
];

/** Minimum accuracy (0-1) needed for 1, 2 and 3 stars */
export const STAR_THRESHOLDS = [0.5, 0.7, 0.9];

/** Stars needed on a level to unlock the next one */
export const STARS_TO_UNLOCK_NEXT = 1;

export const COINS_PER_CORRECT_ANSWER = 5;
export const COINS_PER_STAR = 10;

/* Car config */
export type SkinColor = 'red' | 'blue' | 'green' | 'purple';
export type Upgrade = 'Speed Boost' | 'Better Tires' | 'Shield' | 'Extra Time';
export const MAX_DAMAGE = 100;

export const DEFAULT_SKIN: SkinColor = 'red';

export const SKIN_PRICES: Record<SkinColor, number> = {
    red: 0,
    blue: 50,
    green: 50,
    purple: 75,
};

/** Cost of each engine upgrade; index 0 is the price of going from level 0 to 1 */
export const ENGINE_UPGRADE_PRICES = [40, 80, 150];

/** Extra speed per engine level (0.1 = +10%) */
export const ENGINE_SPEED_BONUS_PER_LEVEL = 0.1;
