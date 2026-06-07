import { describe, expect, it } from "@jest/globals";
import {
  BIOME_DEFINITIONS,
  BIOME_IDS,
  STARTER_BIOME,
  STARTER_BIOME_ID,
  getBiomeDefinition
} from "../world/biomes/BiomeDefinitions.js";

describe("BiomeDefinitions", () => {
  it("defines all eight story biomes", () => {
    expect(BIOME_DEFINITIONS).toHaveLength(8);
    expect(new Set(BIOME_IDS).size).toBe(8);
    expect(BIOME_IDS).toEqual([
      "hearthmere",
      "ironvale",
      "blackroot",
      "sunken_temple",
      "dragon_coast",
      "moonspire",
      "gravehold",
      "ashen_wastes"
    ]);
  });

  it("exposes the runtime-facing fields for every biome", () => {
    for (const definition of BIOME_DEFINITIONS) {
      expect(definition).toHaveProperty("id");
      expect(definition).toHaveProperty("name");
      expect(definition).toHaveProperty("groundColor");
      expect(definition).toHaveProperty("accentColor");
      expect(definition).toHaveProperty("backgroundColor");
      expect(definition).toHaveProperty("fogColor");
      expect(definition).toHaveProperty("fogDensity");
      expect(definition).toHaveProperty("terrainAmplitude");
      expect(definition).toHaveProperty("terrainBaseHeight");
      expect(definition).toHaveProperty("roughness");
      expect(definition).toHaveProperty("metalness");
      expect(definition).toHaveProperty("musicId");
      expect(definition).toHaveProperty("resourceTableId");
      expect(definition).toHaveProperty("enemyTableId");
      expect(typeof definition.id).toBe("string");
      expect(typeof definition.name).toBe("string");
      expect(typeof definition.groundColor).toBe("string");
      expect(typeof definition.accentColor).toBe("string");
      expect(typeof definition.backgroundColor).toBe("string");
      expect(typeof definition.fogColor).toBe("string");
      expect(typeof definition.fogDensity).toBe("number");
      expect(typeof definition.terrainAmplitude).toBe("number");
      expect(typeof definition.terrainBaseHeight).toBe("number");
      expect(typeof definition.roughness).toBe("number");
      expect(typeof definition.metalness).toBe("number");
      expect(definition.fogDensity).toBeGreaterThan(0);
    }
  });

  it("marks Hearthmere as the starter biome", () => {
    expect(STARTER_BIOME_ID).toBe("hearthmere");
    expect(STARTER_BIOME).toBe(getBiomeDefinition("hearthmere"));
    expect(STARTER_BIOME.name).toBe("Hearthmere Outpost");
    expect(STARTER_BIOME.fogColor).toBe("#141009");
    expect(STARTER_BIOME.fogDensity).toBeCloseTo(0.03);
  });
});
