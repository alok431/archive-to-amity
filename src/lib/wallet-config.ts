/* Demo wallet rules, kept separate from presentation so fees and limits can be tested. */
export const WITHDRAW_FEE_RATE = 0.05;
export const WITHDRAW_MIN_FEE = 10;
export const WITHDRAW_MIN_AMOUNT = 100;

export function withdrawFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.max(WITHDRAW_MIN_FEE, Math.round(amount * WITHDRAW_FEE_RATE));
}

export function withdrawTotal(amount: number): number {
  return amount > 0 ? amount + withdrawFee(amount) : 0;
}
