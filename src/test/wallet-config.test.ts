import { describe, expect, it } from "vitest";
import { WITHDRAW_MIN_AMOUNT, WITHDRAW_MIN_FEE, withdrawFee, withdrawTotal } from "@/lib/wallet-config";

describe("withdrawal fee rules", () => {
  it("charges 5% of the amount", () => {
    expect(withdrawFee(1000)).toBe(50);
  });
  it("never charges less than the minimum fee", () => {
    expect(withdrawFee(100)).toBe(WITHDRAW_MIN_FEE);
  });
  it("adds the fee on top of the amount", () => {
    expect(withdrawTotal(1000)).toBe(1050);
  });
  it("charges nothing for empty or invalid amounts", () => {
    expect(withdrawFee(0)).toBe(0);
    expect(withdrawTotal(0)).toBe(0);
  });
  it("keeps the minimum withdrawal at 100 IQ", () => {
    expect(WITHDRAW_MIN_AMOUNT).toBe(100);
  });
});
