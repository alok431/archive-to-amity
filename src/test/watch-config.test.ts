import { describe, expect, it } from "vitest";
import { ADS_PER_BLOCK, watchBlocks } from "@/components/snow/watch-config";

describe("Watch ads requirements", () => {
  it("provides exactly four separate ad blocks", () => {
    expect(watchBlocks).toHaveLength(4);
    expect(new Set(watchBlocks.map((block) => block.id)).size).toBe(4);
  });
  it("limits each block to ten ads", () => {
    expect(ADS_PER_BLOCK).toBe(10);
  });
});