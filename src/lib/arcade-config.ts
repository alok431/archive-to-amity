/* Pure arcade rules: run lengths, lives and reward formulas for the three mini-games. */
export type ArcadeGame = "drift" | "icicle" | "striker" | "tower";

export const ARCADE_REWARD_CAP = 150;
export const DRIFT_SECONDS = 60;
export const STRIKER_SECONDS = 90;
export const ARCADE_LIVES = 3;
export const TOWER_RINGS = 30;

export interface ArcadeStats { score: number; gems: number }

/** Cubes credited for a finished run (never negative, capped per run). */
export function arcadeReward(game: ArcadeGame, { score, gems }: ArcadeStats): number {
  const s = Math.max(0, Math.floor(score));
  const g = Math.max(0, Math.floor(gems));
  let raw = 0;
  if (game === "drift") raw = Math.floor(s / 50) + g * 2; // score = distance
  if (game === "icicle") raw = s * 15 + g * 3; // score = stages cleared
  if (game === "striker") raw = s * 2 + g * 3; // score = meteors shattered
  if (game === "tower") raw = Math.floor(s / 2) + g * 10; // score = rings smashed, gems = towers cleared
  return Math.min(ARCADE_REWARD_CAP, raw);
}

/** Icicles needed to clear a Frost Core stage (stage starts at 1). */
export function icicleStageTarget(stage: number): number {
  if (game === "tower") raw = Math.floor(s / 2) + g * 10; // score = rings smashed, gems = towers cleared
  return Math.min(12, 5 + stage);
}
