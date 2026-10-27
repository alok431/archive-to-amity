export const SPIN_REWARDS = [50, 100, 25, 200, 80, 500, 40, 150] as const;
export const REFERRAL_COMMISSION = 0.10;
export function spinOutcome(random: number) {
  const index = Math.min(SPIN_REWARDS.length - 1, Math.max(0, Math.floor(random * SPIN_REWARDS.length)));
  return { index, reward: SPIN_REWARDS[index] ?? 50, angle: 360 - index * 45 };
}