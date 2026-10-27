import { describe, expect, it } from "vitest";
import { REFERRAL_COMMISSION, SPIN_REWARDS, spinOutcome } from "@/lib/spin-config";

describe("spin and referral rules", () => {
  it("selects each segment and aligns its center with the pointer", () => {
    SPIN_REWARDS.forEach((reward, index) => {
      const result = spinOutcome((index + 0.5) / 8);
      expect(result.reward).toBe(reward);
      expect((result.angle + index * 45) % 360).toBe(0);
    });
    expect(spinOutcome(0).reward).toBe(50);
    expect(spinOutcome(0.999).reward).toBe(150);
  });
  it("uses the reference's 10% lifetime commission", () => {
    expect(REFERRAL_COMMISSION).toBe(0.10);
    expect(1000 * REFERRAL_COMMISSION).toBe(100);
  });
});