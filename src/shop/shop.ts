import type { GameState } from "../Game/GameState";
import {
  ENGINE_UPGRADE_PRICES,
  MAX_SHIELDS,
  SKIN_PRICES,
  UPGRADE_PRICES,
} from "../Game/gameConfig";
import type { SkinColor, Upgrade } from "../Game/gameConfig";

// Describes what is for sale and checks every purchase and reports why it failed

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: "engine" | "skin" | "upgrade";
  // Cost to buy, or null when no further purchase is available.
  price: number | null;
  owned: boolean;
  // Can be purchased at the current balance and inventory level.
  affordable: boolean;
  inventory?: { count: number; limit: number };
}
const SKINS: SkinColor[] = ["red", "blue", "yellow", "white", "black", "pink", "green", "purple"];
const UPGRADES: Upgrade[] = [
  "Speed Boost",
  "Better Tires",
  "Shield",
  "Extra Time",
];
// Descriptions of upgrades for the shop screen
export const UPGRADE_DESCRIPTIONS: Record<Upgrade, string> = {
  "Speed Boost": "A burst of speed when you answer correctly.",
  "Better Tires": "Wrong answers slow you down less.",
  Shield: "Blocks one hit of vehicle damage.",
  "Extra Time": "Adds seconds to the question timer.",
};

export class Shop {
  private game: GameState;

  constructor(game: GameState) {
    this.game = game;
  }

  equipSkin(skin: SkinColor): boolean {
    if (!SKINS.includes(skin)) {
      return false;
    }
    return this.game.selectSkin(skin);
  }
  // Return the player's current number of coins.
  getBalance(): number {
    return this.game.getCoins();
  }

  // Return every item available in the shop
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
      const owned = this.game.ownsUpgrade(upgrade);
      const inventory = upgrade === "Shield"
        ? { count: this.game.getShieldCount(), limit: MAX_SHIELDS }
        : undefined;
      const canPurchase = inventory ? inventory.count < inventory.limit : !owned;
      const price = canPurchase ? UPGRADE_PRICES[upgrade] : null;

      items.push({
        id: `upgrade:${upgrade}`,
        name: upgrade,
        description: UPGRADE_DESCRIPTIONS[upgrade],
        category: "upgrade",
        price,
        owned,
        affordable: price !== null && balance >= price,
        ...(inventory && { inventory }),
      });
    }

    return items;
  }

  purchase(id: string): boolean {
    // Engine upgrade
    if (id === "engine") {
      return this.game.buyEngineUpgrade();
    }

    // Skin purchase
    if (id.startsWith("skin:")) {
      const skin = id.substring(5);
      if (!SKINS.includes(skin as SkinColor)) {
        return false;
      }
      return this.game.buySkin(skin as SkinColor);
    }

    // Upgrade purchase
    if (id.startsWith("upgrade:")) {
      const upgrade = id.substring(8);

      if (!UPGRADES.includes(upgrade as Upgrade)) {
        return false;
      }
      return this.game.buyUpgrade(upgrade as Upgrade);
    }

    return false;
  }


}
