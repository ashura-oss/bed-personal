import { describe, expect, it } from "@jest/globals";
import {
  ENEMY_DEFINITIONS,
  getEnemiesForBiome,
  getEnemyDefinition,
  getEnemyDefinitionForPlacementTags
} from "../gameplay/enemies/EnemyDefinitions.js";
import { hasItemDefinition } from "../gameplay/items/ItemDefinitions.js";

describe("EnemyDefinitions", () => {
  it("getEnemiesForBiome('hearthmere') returns at least one entry", () => {
    const defs = getEnemiesForBiome("hearthmere");
    expect(defs.length).toBeGreaterThanOrEqual(1);
  });

  it("getEnemiesForBiome returns only entries whose biomes include the requested id", () => {
    // 'ironvale' is not in any current def's biomes — expect empty array
    const defs = getEnemiesForBiome("ironvale");
    for (const def of defs) {
      expect(def.biomes).toContain("ironvale");
    }
  });

  it("getEnemiesForBiome('unknown_biome') returns []", () => {
    expect(getEnemiesForBiome("unknown_biome")).toEqual([]);
  });

  it("getEnemiesForBiome with empty string returns []", () => {
    expect(getEnemiesForBiome("")).toEqual([]);
  });

  it("getEnemiesForBiome with non-string returns []", () => {
    expect(getEnemiesForBiome(null)).toEqual([]);
    expect(getEnemiesForBiome(undefined)).toEqual([]);
    expect(getEnemiesForBiome(42)).toEqual([]);
  });

  it("getEnemyDefinition resolves authored enemy ids", () => {
    expect(getEnemyDefinition("hollow_shambler")?.name).toBe("Hollow Shambler");
    expect(getEnemyDefinition(" briar_wolf ")?.name).toBe("Briar Wolf");
  });

  it("getEnemyDefinitionForPlacementTags resolves the first matching authored tag", () => {
    expect(getEnemyDefinitionForPlacementTags(["unused", "hollow_shambler"])?.id).toBe("hollow_shambler");
    expect(getEnemyDefinitionForPlacementTags(["briar_wolf"])?.id).toBe("briar_wolf");
  });

  it("enemy lookup helpers return null for unknown ids or empty placement tags", () => {
    expect(getEnemyDefinition("unknown_enemy")).toBeNull();
    expect(getEnemyDefinitionForPlacementTags([])).toBeNull();
    expect(getEnemyDefinitionForPlacementTags(["unknown_enemy"])).toBeNull();
    expect(getEnemyDefinitionForPlacementTags(undefined)).toBeNull();
  });

  it("every definition has required fields with correct types", () => {
    const requiredFields = [
      "id",
      "name",
      "hp",
      "damage",
      "aggroRange",
      "attackRange",
      "speed",
      "lootTable",
      "biomes",
      "maxPerChunk",
    ];
    for (const def of ENEMY_DEFINITIONS) {
      for (const field of requiredFields) {
        expect(def).toHaveProperty(field);
      }
      expect(typeof def.id).toBe("string");
      expect(typeof def.name).toBe("string");
      expect(typeof def.hp).toBe("number");
      expect(def.hp).toBeGreaterThan(0);
      expect(typeof def.damage).toBe("number");
      expect(def.damage).toBeGreaterThan(0);
      expect(typeof def.aggroRange).toBe("number");
      expect(typeof def.attackRange).toBe("number");
      expect(typeof def.speed).toBe("object");
      expect(typeof def.speed.wander).toBe("number");
      expect(typeof def.speed.chase).toBe("number");
      expect(Array.isArray(def.lootTable)).toBe(true);
      expect(Array.isArray(def.biomes)).toBe(true);
      expect(def.biomes.length).toBeGreaterThan(0);
      expect(typeof def.maxPerChunk).toBe("number");
      expect(def.maxPerChunk).toBeGreaterThan(0);
    }
  });

  it("every loot table entry has itemId, count, and chance in valid range", () => {
    for (const def of ENEMY_DEFINITIONS) {
      for (const loot of def.lootTable) {
        expect(typeof loot.itemId).toBe("string");
        expect(loot.itemId.length).toBeGreaterThan(0);
        expect(hasItemDefinition(loot.itemId)).toBe(true);
        expect(typeof loot.count).toBe("number");
        expect(loot.count).toBeGreaterThan(0);
        expect(typeof loot.chance).toBe("number");
        expect(loot.chance).toBeGreaterThan(0);
        expect(loot.chance).toBeLessThanOrEqual(1);
      }
    }
  });

  it("all biome references are lowercase strings", () => {
    for (const def of ENEMY_DEFINITIONS) {
      for (const biomeId of def.biomes) {
        expect(typeof biomeId).toBe("string");
        expect(biomeId).toBe(biomeId.toLowerCase());
      }
    }
  });

  it("each definition id is unique", () => {
    const ids = ENEMY_DEFINITIONS.map((d) => d.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("getEnemiesForBiome('blackroot') returns entries that include blackroot in biomes", () => {
    const defs = getEnemiesForBiome("blackroot");
    expect(defs.length).toBeGreaterThanOrEqual(1);
    for (const def of defs) {
      expect(def.biomes).toContain("blackroot");
    }
  });

  it("getEnemiesForBiome filters correctly — returned set is subset of ENEMY_DEFINITIONS", () => {
    const allIds = new Set(ENEMY_DEFINITIONS.map((d) => d.id));
    const defs = getEnemiesForBiome("hearthmere");
    for (const def of defs) {
      expect(allIds.has(def.id)).toBe(true);
    }
  });
});
