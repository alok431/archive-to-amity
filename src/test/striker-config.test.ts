import { describe, expect, it } from "vitest";
import { STRIKER_SECONDS } from "@/lib/arcade-config";
import { strikerDifficulty, strikerEnemyVolley, strikerUpgrade, strikerPlaneSize, strikerWeapon, STRIKER_BOSS_VOLLEY_SECONDS, STRIKER_MAX_HOSTILE } from "@/lib/striker-config";

describe("Blizzard Striker balancing", () => {
  it("lasts 200 seconds", () => expect(STRIKER_SECONDS).toBe(200));
  it("caps late wave speed and enemy toughness", () => {
    expect(strikerDifficulty(170)).toEqual({ tier: 3, hpBonus: 2, waveSeconds: 4, bulletSpeed: 170 });
    expect(strikerDifficulty(200)).toEqual(strikerDifficulty(170));
  });
  it("has enemies firing two and three bullets per volley", () => {
    expect(strikerEnemyVolley("twin").offsets).toHaveLength(2);
    expect(strikerEnemyVolley("tank").offsets).toHaveLength(3);
  });
  it("collecting upgrades enlarges the plane through two permanent evolutions", () => {
    expect(strikerUpgrade(0)).toBe(1);
    expect(strikerUpgrade(1)).toBe(2);
    expect(strikerUpgrade(2)).toBe(2);
    expect([0, 1, 2].map(strikerPlaneSize)).toEqual([64, 80, 96]);
  });
  it("evolves weapons from single to twin to five-way fire", () => {
    expect([0, 1, 2].map((n) => strikerWeapon(n).offsets.length)).toEqual([1, 2, 5]);
  });
  it("gives gaps between boss volleys and caps active hostile bullets", () => {
    expect(STRIKER_BOSS_VOLLEY_SECONDS).toBe(2.8);
    expect(STRIKER_MAX_HOSTILE).toBe(28);
  });
});