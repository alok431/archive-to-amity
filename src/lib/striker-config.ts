/** Browser-safe balancing and permanent progression for Blizzard Striker. */
export type StrikerEnemyKind = "fighter" | "tank" | "sniper" | "twin" | "interceptor" | "bomber";
export const STRIKER_GUNS = ["Frost", "Twin", "Aurora"] as const;
export const STRIKER_BOSS_HP = 180;
export const STRIKER_BOSS_VOLLEY_SECONDS = 2.8;
export const STRIKER_BOSS_FAN_SECONDS = 4.5;
export const STRIKER_MAX_HOSTILE = 28;
export const STRIKER_UPGRADE_EVERY = 24;

export function strikerDifficulty(elapsed: number) {
  const tier = Math.min(6, Math.floor(Math.max(0, elapsed) / 30));
  return { tier, hpBonus: Math.min(4, tier), waveSeconds: Math.max(2.8, 5.5 - tier * 0.45), bulletSpeed: 125 + tier * 18, fireRate: 1 + tier * 0.12, movementSpeed: 1 + tier * 0.06 };
}

export function strikerEnemyVolley(kind: StrikerEnemyKind) {
  if (kind === "tank") return { offsets: [-0.3, 0, 0.3], ports: [0, 0, 0], delays: [0, 0, 0], aimed: true, cooldown: 3.4, speedMultiplier: 0.8 };
  if (kind === "twin") return { offsets: [0, 0], ports: [-13, 13], delays: [0, 0], aimed: true, cooldown: 3.2, speedMultiplier: 1 };
  if (kind === "sniper") return { offsets: [0, 0, 0], ports: [0, 0, 0], delays: [0, 0.18, 0.36], aimed: true, cooldown: 4.4, speedMultiplier: 1.15 };
  if (kind === "interceptor") return { offsets: [-0.16, 0.16], ports: [-8, 8], delays: [0, 0.12], aimed: false, cooldown: 3.8, speedMultiplier: 1 };
  if (kind === "bomber") return { offsets: [-0.6, -0.3, 0, 0.3, 0.6], ports: [0, 0, 0, 0, 0], delays: [0, 0, 0, 0, 0], aimed: false, cooldown: 4.8, speedMultiplier: 0.65 };
  return { offsets: [0], ports: [0], delays: [0], aimed: true, cooldown: 3.6, speedMultiplier: 1 };
}

export function strikerUpgrade(current: number): number {
  return Math.min(2, Math.max(0, current) + 1);
}

/** Visual growth never increases the collision radius. */
export function strikerPlaneSize(gun: number): number {
  return [48, 78, 102][Math.min(2, Math.max(0, gun))] ?? 48;
}

export function strikerWeapon(gun: number) {
  if (gun >= 2) return { offsets: [-0.22, -0.11, 0, 0.11, 0.22], cooldown: 0.19, width: 4.4 };
  if (gun === 1) return { offsets: [0, 0], cooldown: 0.2, width: 4.2 };
  return { offsets: [0], cooldown: 0.22, width: 4 };
}