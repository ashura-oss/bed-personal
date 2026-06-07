import { describe, expect, it } from "@jest/globals";
import { HEARTHMERE_BOSS_ARENA, HEARTHMERE_PLACEMENTS } from "../world/regions/hearthmere/placements.js";

const BOUNDS = { minX: -2500, maxX: 2500, minZ: -2000, maxZ: 2000 };

describe("HEARTHMERE_BOSS_ARENA", () => {
  it("has required shape: id, bossName, center, gatePosition, armRadius, sealRadius", () => {
    expect(typeof HEARTHMERE_BOSS_ARENA.id).toBe("string");
    expect(HEARTHMERE_BOSS_ARENA.id.length).toBeGreaterThan(0);

    expect(typeof HEARTHMERE_BOSS_ARENA.bossName).toBe("string");
    expect(HEARTHMERE_BOSS_ARENA.bossName.length).toBeGreaterThan(0);

    expect(Number.isFinite(HEARTHMERE_BOSS_ARENA.center.x)).toBe(true);
    expect(Number.isFinite(HEARTHMERE_BOSS_ARENA.center.z)).toBe(true);

    expect(Number.isFinite(HEARTHMERE_BOSS_ARENA.gatePosition.x)).toBe(true);
    expect(Number.isFinite(HEARTHMERE_BOSS_ARENA.gatePosition.z)).toBe(true);

    expect(HEARTHMERE_BOSS_ARENA.armRadius).toBeGreaterThan(0);
    expect(HEARTHMERE_BOSS_ARENA.sealRadius).toBeGreaterThan(0);
  });

  it("center is within Hearthmere world bounds", () => {
    const { x, z } = HEARTHMERE_BOSS_ARENA.center;
    expect(x).toBeGreaterThanOrEqual(BOUNDS.minX);
    expect(x).toBeLessThanOrEqual(BOUNDS.maxX);
    expect(z).toBeGreaterThanOrEqual(BOUNDS.minZ);
    expect(z).toBeLessThanOrEqual(BOUNDS.maxZ);
  });

  it("gatePosition is within Hearthmere world bounds", () => {
    const { x, z } = HEARTHMERE_BOSS_ARENA.gatePosition;
    expect(x).toBeGreaterThanOrEqual(BOUNDS.minX);
    expect(x).toBeLessThanOrEqual(BOUNDS.maxX);
    expect(z).toBeGreaterThanOrEqual(BOUNDS.minZ);
    expect(z).toBeLessThanOrEqual(BOUNDS.maxZ);
  });

  it("gatePosition is within armRadius of center (arm→seal transition is reachable)", () => {
    const dx = HEARTHMERE_BOSS_ARENA.gatePosition.x - HEARTHMERE_BOSS_ARENA.center.x;
    const dz = HEARTHMERE_BOSS_ARENA.gatePosition.z - HEARTHMERE_BOSS_ARENA.center.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    expect(dist).toBeLessThanOrEqual(HEARTHMERE_BOSS_ARENA.armRadius);
  });

  it("sealRadius < armRadius (seal zone is strictly inside the arm zone)", () => {
    expect(HEARTHMERE_BOSS_ARENA.sealRadius).toBeLessThan(HEARTHMERE_BOSS_ARENA.armRadius);
  });

  it("arena center is within ~50 units of the crypt prefab (boss lives at the crypt)", () => {
    const crypt = HEARTHMERE_PLACEMENTS.find((p) => p.id === "hearthmere.prefab.crypt");
    expect(crypt).toBeDefined();

    const dx = HEARTHMERE_BOSS_ARENA.center.x - crypt.origin.x;
    const dz = HEARTHMERE_BOSS_ARENA.center.z - crypt.origin.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    expect(dist).toBeLessThanOrEqual(50);
  });

  it("boss coordinates are derived from the crypt prefab offsets", () => {
    const crypt = HEARTHMERE_PLACEMENTS.find((p) => p.id === HEARTHMERE_BOSS_ARENA.placementId);
    expect(crypt).toBeDefined();
    expect(HEARTHMERE_BOSS_ARENA.prefabId).toBe("hearthmere_crypt");
    expect(HEARTHMERE_BOSS_ARENA.center).toEqual({
      x: crypt.origin.x + HEARTHMERE_BOSS_ARENA.centerOffset.x,
      z: crypt.origin.z + HEARTHMERE_BOSS_ARENA.centerOffset.z
    });
    expect(HEARTHMERE_BOSS_ARENA.gatePosition).toEqual({
      x: crypt.origin.x + HEARTHMERE_BOSS_ARENA.gateOffset.x,
      z: crypt.origin.z + HEARTHMERE_BOSS_ARENA.gateOffset.z
    });
  });

  it("bossName contains 'Hollowbound' (correct boss identity for Hearthmere)", () => {
    expect(HEARTHMERE_BOSS_ARENA.bossName).toContain("Hollowbound");
  });
});
