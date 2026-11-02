import { afterEach, expect, it, vi } from "vitest";
import { setSfxEnabled, sfx } from "@/lib/sfx";

afterEach(() => { setSfxEnabled(true); vi.unstubAllGlobals(); });

it("plays a firing sweep for player shots and silences it when muted", () => {
  const sweep = vi.fn();
  const gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  const node = { connect: vi.fn().mockReturnThis() };
  const oscillator = { ...node, frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: sweep }, start: vi.fn(), stop: vi.fn() };
  class AudioMock {
    state = "running"; currentTime = 0; destination = {};
    createOscillator() { return oscillator; }
    createGain() { return { ...node, gain }; }
  }
  vi.stubGlobal("AudioContext", AudioMock);
  sfx.shoot(0);
  expect(sweep).toHaveBeenCalledWith(260, 0.065);
  expect(oscillator.start).toHaveBeenCalledTimes(1);
  setSfxEnabled(false);
  sfx.shoot(2);
  expect(oscillator.start).toHaveBeenCalledTimes(1);
});