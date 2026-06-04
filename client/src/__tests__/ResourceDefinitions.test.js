import { describe, expect, it } from "@jest/globals";
import {
  RESOURCE_DEFINITIONS,
  getResourcesForBiome
} from "../world/resources/ResourceDefinitions.js";

describe("ResourceDefinitions", () => {
  it("exports a non-empty RESOURCE_DEFINITIONS array", () => {
    expect(Array.isArray(RESOURCE_DEFINITIONS)).toBe(true);
    expect(RESOURCE_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it("getResourcesForBiome('hearthmere') returns at least 2 entries", () => {
    const results = getResourcesForBiome("hearthmere");
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("hearthmere results include wood and ore", () => {
    const results = getResourcesForBiome("hearthmere");
    const ids = results.map((r) => r.id);
    expect(ids).toContain("wood");
    expect(ids).toContain("ore");
  });

  it("getResourcesForBiome('ironvale') returns ore but not herb-only types", () => {
    const results = getResourcesForBiome("ironvale");
    const ids = results.map((r) => r.id);
    expect(ids).toContain("ore");
    // herb (Ashleaf) is only in hearthmere and ashen_wastes — not ironvale
    expect(ids).not.toContain("herb");
  });

  it("getResourcesForBiome('unknown') returns []", () => {
    expect(getResourcesForBiome("unknown")).toEqual([]);
  });

  it("getResourcesForBiome with empty string returns []", () => {
    expect(getResourcesForBiome("")).toEqual([]);
  });

  it("every definition has the required fields", () => {
    for (const def of RESOURCE_DEFINITIONS) {
      expect(typeof def.id).toBe("string");
      expect(typeof def.name).toBe("string");
      expect(Array.isArray(def.biomes)).toBe(true);
      expect(def.biomes.length).toBeGreaterThan(0);
      expect(typeof def.meshColor).toBe("number");
      expect(["box", "sphere", "cylinder"]).toContain(def.meshType);
      expect(typeof def.hitPoints).toBe("number");
      expect(def.hitPoints).toBeGreaterThan(0);
      expect(typeof def.yield.itemId).toBe("string");
      expect(typeof def.yield.count).toBe("number");
      expect(def.yield.count).toBeGreaterThan(0);
    }
  });

  it("all returned definitions are valid for the queried biome", () => {
    const biomes = ["hearthmere", "ironvale", "blackroot", "ashen_wastes", "moonspire", "gravehold"];
    for (const biome of biomes) {
      const results = getResourcesForBiome(biome);
      for (const def of results) {
        expect(def.biomes).toContain(biome);
      }
    }
  });
});
