// Pure game rules for the frontend simulation (no backend yet).
export const STREAK_REWARDS = [50, 80, 100, 150, 200, 300, 500] as const;
export const ADS_PER_BLOCK = 10;
export const AD_BLOCK_REWARD = 100;
export const AD_WATCH_SECONDS = 3;
export const TASK_VERIFY_SECONDS = 5;
export const MINER_MAX_ENERGY = 100;
export const MINER_REGEN_MS = 3000;

export type TaskStatus = "idle" | "verifying" | "claim" | "done";

export interface GameState {
  balance: number;
  streakCount: number; // days claimed in current 7-day cycle
  lastStreakDay: string | null; // YYYY-MM-DD
  ads: Record<string, number>;
  tasks: Record<string, TaskStatus>;
  sound: boolean;
  energy: number;
  energyAt: number;
  best: Record<string, number>; // best run reward per game
}

export const initialState = (): GameState => ({
  balance: 5680,
  streakCount: 0,
  lastStreakDay: null,
  ads: {},
  tasks: {},
  sound: true,
  energy: MINER_MAX_ENERGY,
  energyAt: 0,
  best: {},
});

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Streak count shown today; a missed day resets the cycle. */
export function currentStreak(s: GameState, today: string) {
  if (!s.lastStreakDay) return 0;
  const gap = daysBetween(s.lastStreakDay, today);
  if (gap > 1) return 0;
  return s.streakCount % 7 === 0 && gap === 1 ? 0 : s.streakCount;
}

export function canClaimStreak(s: GameState, today: string) {
  return s.lastStreakDay !== today;
}

export function claimStreak(s: GameState, today: string): { state: GameState; reward: number } {
  if (!canClaimStreak(s, today)) return { state: s, reward: 0 };
  const base = currentStreak(s, today);
  const reward = STREAK_REWARDS[base]!;
  return { state: { ...s, streakCount: base + 1, lastStreakDay: today, balance: s.balance + reward }, reward };
}

export function watchAd(s: GameState, id: string): GameState {
  const n = s.ads[id] ?? 0;
  if (n >= ADS_PER_BLOCK) return s;
  return { ...s, ads: { ...s.ads, [id]: n + 1 } };
}

export function claimAdBlock(s: GameState, id: string): { state: GameState; reward: number } {
  if ((s.ads[id] ?? 0) < ADS_PER_BLOCK) return { state: s, reward: 0 };
  return { state: { ...s, balance: s.balance + AD_BLOCK_REWARD, ads: { ...s.ads, [id]: 0 } }, reward: AD_BLOCK_REWARD };
}

export function setTask(s: GameState, id: string, status: TaskStatus): GameState {
  return { ...s, tasks: { ...s.tasks, [id]: status } };
}

export function claimTask(s: GameState, id: string, reward: number): { state: GameState; reward: number } {
  if (s.tasks[id] !== "claim") return { state: s, reward: 0 };
  return { state: { ...setTask(s, id, "done"), balance: s.balance + reward }, reward };
}

export function regenEnergy(s: GameState, now: number): GameState {
  if (s.energy >= MINER_MAX_ENERGY) return { ...s, energyAt: now };
  const gained = Math.floor((now - s.energyAt) / MINER_REGEN_MS);
  if (gained <= 0) return s;
  const energy = Math.min(MINER_MAX_ENERGY, s.energy + gained);
  return { ...s, energy, energyAt: energy >= MINER_MAX_ENERGY ? now : s.energyAt + gained * MINER_REGEN_MS };
}

/** One tap: costs 1 energy, mines 1 cube, every 10th combo tap gives +5 bonus. */
export function mine(s: GameState, combo: number, now: number): { state: GameState; reward: number } {
  const r = regenEnergy(s, now);
  if (r.energy <= 0) return { state: r, reward: 0 };
  const reward = 1 + ((combo + 1) % 10 === 0 ? 5 : 0);
  const energyAt = r.energy >= MINER_MAX_ENERGY ? now : r.energyAt;
  return { state: { ...r, energy: r.energy - 1, energyAt, balance: r.balance + reward }, reward };
}

/** Records a finished run; returns whether it beat the previous best. */
export function recordBest(s: GameState, game: string, value: number): { state: GameState; isNew: boolean } {
  const prev = s.best?.[game] ?? 0;
  if (value <= prev) return { state: s, isNew: false };
  return { state: { ...s, best: { ...s.best, [game]: value } }, isNew: prev > 0 || value > 0 };
}
