import { describe, expect, it } from "vitest";
import { arcadeReward, icicleStageTarget, ARCADE_REWARD_CAP } from "@/lib/arcade-config";

describe("arcade rewards", () => {
  it("drift pays 1 per 50 distance plus 2 per crystal", () => {
    expect(arcadeReward("drift", { score: 1000, gems: 5 })).toBe(30);
  });
  it("icicle pays 15 per stage plus 3 per gem", () => {
    expect(arcadeReward("icicle", { score: 3, gems: 2 })).toBe(51);
  });
  it("striker pays 2 per meteor plus 3 per gem", () => {
    expect(arcadeReward("striker", { score: 20, gems: 1 })).toBe(43);
  });
  it("caps every run at 150", () => {
    expect(ARCADE_REWARD_CAP).toBe(150);
    expect(arcadeReward("striker", { score: 999, gems: 99 })).toBe(150);
  });
  it("never pays negative", () => {
    expect(arcadeReward("drift", { score: -5, gems: -1 })).toBe(0);
  });
  it("icicle stages need 6 throws at stage 1, max 12", () => {
    expect(icicleStageTarget(1)).toBe(6);
    expect(icicleStageTarget(20)).toBe(12);
  });
});
