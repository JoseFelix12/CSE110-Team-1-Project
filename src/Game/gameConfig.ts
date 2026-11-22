/**
 * gameConfig - Static data for levels and the shop.
 * Screens and the question generator read from here so every level
 * is defined in one place.
 */

export type Operator = '*' | '/' | '+' | '-';

/** Road and scenery a level is raced on: dirt = desert, raceTrack = stadium, street = city */
export type LevelTheme = 'dirt' | 'raceTrack' | 'street';

export interface LevelConfig {
    id: number;
    name: string;
    description: string;
    theme: LevelTheme;
    /** Operators the question generator should use for this level */
    operators: Operator[];
    /** Largest factor used when building questions (e.g. 10 -> up to 10 x 10) */
    minFactor: number;
    maxFactor: number;
    questionCount: number;
}

// Every level uses Level 1's math for now; each level's own math comes later
export const LEVELS: LevelConfig[] = [
    {
        id: 1,
        name: 'Desert Dash',
        description: 'Addition and Subtraction (2 digit numbers).',
        theme: 'dirt',
        operators: ['+', '-'],
        minFactor: 10,
        maxFactor: 99,
        questionCount: 15,
    },
    {
        id: 2,
        name: 'Rookie Raceway',
        description: 'Multiplication with factors up to 6.',
        theme: 'raceTrack',
        operators: ['*'],
        minFactor: 1,
        maxFactor: 6,
        questionCount: 15,
    },
    {
        id: 3,
        name: 'City Streets',
        description: 'Multiplication with factors up to 12.',
        theme: 'street',
        operators: ['*'],
        minFactor: 1,
        maxFactor: 12,
        questionCount: 15,
    },

    {
        id: 4,
        name: 'Nascar Runway',
        description: 'Division with factors up to 6',
        theme: 'raceTrack',
        operators: ['/'],
        minFactor: 1,
        maxFactor: 6,
        questionCount: 15,
    },

    {
        id: 5,
        name: 'Downtown Dash',
        description: 'Division with factors up to 12',
        theme: 'street',
        operators: ['/'],
        minFactor: 1,
        maxFactor: 12,
        questionCount: 15,
    },
];

/** Most stars a race can earn: 1 star for each opponent the player beats */
export const MAX_STARS = 3;

/** Stars needed on a level to unlock the next one */
export const STARS_TO_UNLOCK_NEXT = 1;

export const COINS_PER_CORRECT_ANSWER = 5;
export const COINS_PER_STAR = 10;

/* Car config */
export type SkinColor = 'red' | 'blue' | 'green' |'yellow'| 'purple'|'pink'|'white'|'black';
export type Upgrade = 'Speed Boost' | 'Better Tires' | 'Shield' | 'Extra Time';
export const MAX_HEALTH = 100;

export const DEFAULT_SKIN: SkinColor = 'red';
export const STARTER_SKINS: SkinColor[] = [DEFAULT_SKIN, 'blue', 'yellow'];

export const SKIN_PRICES: Record<SkinColor, number> = {
    red: 0,
    blue: 0,
    green: 50,
    purple: 75,
    pink: 75,
    black: 75,
    white: 75,
    yellow: 0

};

/** Cost of each engine upgrade; index 0 is the price of going from level 0 to 1 */
export const ENGINE_UPGRADE_PRICES = [40, 80, 150];

/** Extra speed per engine level (0.1 = +10%) */
export const ENGINE_SPEED_BONUS_PER_LEVEL = 0.1;

//These are placeholder prices.
// Price of each one time upgrade
export const UPGRADE_PRICES: Record<Upgrade, number> = {
  "Speed Boost": 20,
  "Better Tires": 30,
  "Shield": 25,
  "Extra Time": 35,
};

