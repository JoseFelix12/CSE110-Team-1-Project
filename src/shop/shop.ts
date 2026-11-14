import type { GameState } from "../Game/GameState";
import { ENGINE_UPGRADE_PRICES, SKIN_PRICES, UPGRADE_PRICES } from "../Game/gameConfig";
import type { SkinColor, Upgrade } from "../Game/gameConfig";

// Describes what is for sale and checks every purchase and reports why it failed


export interface ShopItem {
    id: string;
    name: string;
    description: string;
    category: 'engine' | 'skin' | 'upgrade';
    // Cost to buy, or null once it is owned 
    price: number | null;
    owned: boolean;
    // Not owned yet and the player has enough coins
    affordable: boolean;
}
const SKINS: SkinColor[] = [
    'red', 
    'blue',
    'green', 
    'purple',
]
const UPGRADES: Upgrade[] = [
    'Speed Boost',
    'Better Tires',
    'Shield',
    'Extra Time',
]
// Descriptions of upgrades for the shop screen
// Also placeholder
export const UPGRADE_DESCRIPTIONS: Record<Upgrade, string> = {
  "Speed Boost": "A burst of speed when you answer correctly.",
  "Better Tires": "Wrong answers slow you down less.",
  "Shield": "Blocks the damage from one wrong answer per race.",
  "Extra Time": "Adds seconds to the question timer.",
};



export class Shop {
    private game: GameState;

    constructor(game: GameState) {
        this.game = game;
    }


    // Return the player's current number of coins.
    getBalance(): number {
        return this.game.getCoins();
    }

  // Return every shop item, or only the items in one category.
    getCatalog(): ShopItem[] {
        const items: ShopItem[] = [];
        const balance = this.getBalance();

        //Engine Upgrade
        const engineLevel = this.game.getCar().getEngineLevel();
        const enginePrice = ENGINE_UPGRADE_PRICES[engineLevel] ?? null;

        items.push({
            id: "engine",
            name: "Engine Upgrade",
            description: "Increase your car speed.",
            category: "engine",
            price: enginePrice,
            owned: enginePrice === null,
            affordable: enginePrice !== null && balance >= enginePrice,
        });


        //Skins
        for (const skin of SKINS) {
            const price = SKIN_PRICES[skin];
            const owned = this.game.ownsSkin(skin);
            items.push({
                id: `skin:${skin}`,
                name: `${skin} Skin`,
                description: `Change your car to ${skin}.`,
                category: "skin",
                price: owned ? null : price,
                owned,
                affordable: !owned && balance >= price,
            });
        }

        //Upgrades
        for (const upgrade of UPGRADES) {
            const price = UPGRADE_PRICES[upgrade];
            const owned = this.game.ownsUpgrade(upgrade);

            items.push({
                id: `upgrade:${upgrade}`,
                name: upgrade,
                description: UPGRADE_DESCRIPTIONS[upgrade],
                category: "upgrade",
                price: owned ? null : price,
                owned,
                affordable: !owned && balance >= price, 
            });
        }

        return items;
    }



    purchase(id: string): boolean {
        // Engine upgrade
        if (id === 'engine') {
            const engineLevel = this.game.getCar().getEngineLevel();
            const price = ENGINE_UPGRADE_PRICES[engineLevel];

            if (price === undefined) {
                return false;
            }

            return this.game.purchaseShopItem(price, () => {
                const car = this.game.getMutableCar();

                car.upgradeEngine();
                car.updateSpeedMultiplier();
            });
        }

        // Skin purchase
        if (id.startsWith('skin:')) {
            const skin = id.substring(5);

            if (!SKINS.includes(skin as SkinColor)) {
                return false;
            }

            const selectedSkin = skin as SkinColor;
            const price = SKIN_PRICES[selectedSkin];

            if (this.game.ownsSkin(selectedSkin)) {
                return false;
            }

            return this.game.purchaseShopItem(price, () => {
                this.game.unlockSkin(selectedSkin);
            });
        }

        // Upgrade purchase
        if (id.startsWith('upgrade:')) {
            const upgrade = id.substring(8);

            if (!UPGRADES.includes(upgrade as Upgrade)) {
                return false;
            }

            const selectedUpgrade = upgrade as Upgrade;
            const price = UPGRADE_PRICES[selectedUpgrade];

            if (this.game.ownsUpgrade(selectedUpgrade)) {
                return false;
            }

            return this.game.purchaseShopItem(price, () => {
                this.game.unlockUpgrade(selectedUpgrade);
            });
        }

        return false;
    }


}