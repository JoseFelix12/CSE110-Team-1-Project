import type { Upgrade } from "../Game/gameConfig.ts";

export const UPGRADE_ICONS = {
  "Speed Boost": "/images/shop/upgrades/speed-boost.png",
  "Better Tires": "/images/shop/upgrades/better-tires.png",
  Shield: "/images/shop/upgrades/shield.png",
  "Extra Time": "/images/shop/upgrades/extra-time.png",
} as const satisfies Record<Upgrade, string>;
