import { describe, expect, it } from "@jest/globals";
import { HEARTHMERE_PLACEMENTS } from "../world/regions/hearthmere/placements.js";

// Hearthmere bounds from WorldConfig
const BOUNDS = { minX: -2500, maxX: 2500, minZ: -2000, maxZ: 2000 };

describe("HearthmereContentDensity", () => {
  it("HEARTHMERE_PLACEMENTS has >= 160 entries", () => {
    expect(HEARTHMERE_PLACEMENTS.length).toBeGreaterThanOrEqual(160);
  });

  it("resource placements count >= 100", () => {
    const resources = HEARTHMERE_PLACEMENTS.filter((p) => p.type === "resource");
    expect(resources.length).toBeGreaterThanOrEqual(100);
  });

  it("enemy placements count >= 37", () => {
    const enemies = HEARTHMERE_PLACEMENTS.filter((p) => p.type === "enemy");
    expect(enemies.length).toBeGreaterThanOrEqual(37);
  });

  it("NPC placements count >= 14", () => {
    const npcs = HEARTHMERE_PLACEMENTS.filter((p) => p.type === "npc");
    expect(npcs.length).toBeGreaterThanOrEqual(14);
  });

  it("prefab placements count === 5", () => {
    const prefabs = HEARTHMERE_PLACEMENTS.filter((p) => p.type === "prefab");
    expect(prefabs.length).toBe(5);
  });

  it("all NPC placements have type === 'npc'", () => {
    const npcs = HEARTHMERE_PLACEMENTS.filter((p) => p.type === "npc");
    for (const npc of npcs) {
      expect(npc.type).toBe("npc");
    }
  });

  it("all IDs are unique across the full set", () => {
    const seen = new Set();
    for (const p of HEARTHMERE_PLACEMENTS) {
      expect(seen.has(p.id)).toBe(false);
      seen.add(p.id);
    }
  });

  it("all origins are within Hearthmere world bounds", () => {
    for (const p of HEARTHMERE_PLACEMENTS) {
      expect(p.origin.x).toBeGreaterThanOrEqual(BOUNDS.minX);
      expect(p.origin.x).toBeLessThanOrEqual(BOUNDS.maxX);
      expect(p.origin.z).toBeGreaterThanOrEqual(BOUNDS.minZ);
      expect(p.origin.z).toBeLessThanOrEqual(BOUNDS.maxZ);
    }
  });
});
