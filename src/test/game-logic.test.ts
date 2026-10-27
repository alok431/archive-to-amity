import { describe, expect, it } from "vitest";
import { claimAdBlock, claimStreak, claimTask, initialState, mine, setTask, watchAd } from "@/lib/game-logic";

describe("game rules", () => {
  it("streak pays 50 on day 1 and only once per day", () => {
    const a = claimStreak(initialState(), "2026-10-27");
    expect(a.reward).toBe(50);
    expect(claimStreak(a.state, "2026-10-27").reward).toBe(0);
    expect(claimStreak(a.state, "2026-10-28").reward).toBe(80);
  });
  it("missed day resets streak to day 1", () => {
    const a = claimStreak(claimStreak(initialState(), "2026-10-27").state, "2026-10-28").state;
    expect(claimStreak(a, "2026-10-31").reward).toBe(50);
  });
  it("ad block pays 100 only at 10/10 and resets", () => {
    let s = initialState();
    expect(claimAdBlock(s, "ad-1").reward).toBe(0);
    for (let i = 0; i < 12; i++) s = watchAd(s, "ad-1");
    expect(s.ads["ad-1"]).toBe(10);
    const r = claimAdBlock(s, "ad-1");
    expect(r.reward).toBe(100);
    expect(r.state.ads["ad-1"]).toBe(0);
  });
  it("task pays only after verification reaches claim", () => {
    const s = initialState();
    expect(claimTask(s, "t", 80).reward).toBe(0);
    const r = claimTask(setTask(s, "t", "claim"), "t", 80);
    expect(r.state.balance).toBe(s.balance + 80);
    expect(r.state.tasks["t"]).toBe("done");
  });
  it("mining costs energy and stops at zero", () => {
    const s = { ...initialState(), energy: 1, energyAt: 0 };
    const a = mine(s, 0, 0);
    expect(a.reward).toBe(1);
    expect(mine(a.state, 1, 0).reward).toBe(0);
  });
});
