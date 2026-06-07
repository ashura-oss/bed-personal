import { describe, expect, it } from "@jest/globals";
import { HEARTHMERE_PLACEMENTS } from "../world/regions/hearthmere/placements.js";
import { HearthmereRegion } from "../world/regions/hearthmere/HearthmereRegion.js";
import { PREFAB_CATALOGUE } from "../world/authored/PrefabCatalogue.js";
import { getEnemyDefinitionForPlacementTags } from "../gameplay/enemies/EnemyDefinitions.js";
import { getResourceDefinitionForPlacementTags } from "../world/resources/ResourceDefinitions.js";

const VALID_PREFAB_TAGS = new Set(Object.keys(PREFAB_CATALOGUE));

// Hearthmere bounds from WorldConfig
const BOUNDS = { minX: -2500, maxX: 2500, minZ: -2000, maxZ: 2000 };

describe("HEARTHMERE_PLACEMENTS", () => {
  it("has at least 100 entries", () => {
    expect(HEARTHMERE_PLACEMENTS.length).toBeGreaterThanOrEqual(100);
  });

  it("every entry has id, type, tags array, and finite x/z origin", () => {
    for (const p of HEARTHMERE_PLACEMENTS) {
      expect(typeof p.id).toBe("string");
      expect(p.id.length).toBeGreaterThan(0);
      expect(typeof p.type).toBe("string");
      expect(Array.isArray(p.tags)).toBe(true);
      expect(p.tags.length).toBeGreaterThan(0);
      expect(Number.isFinite(p.origin.x)).toBe(true);
      expect(Number.isFinite(p.origin.z)).toBe(true);
    }
  });

  it("all ids are unique", () => {
    const seen = new Set();

    for (const p of HEARTHMERE_PLACEMENTS) {
      expect(seen.has(p.id)).toBe(false);
      seen.add(p.id);
    }
  });

  it("resource entries all carry a valid resource tag", () => {
    const resources = HEARTHMERE_PLACEMENTS.filter((p) => p.type === "resource");

    expect(resources.length).toBeGreaterThan(0);

    for (const p of resources) {
      const definition = getResourceDefinitionForPlacementTags(p.tags);
      expect(definition).not.toBeNull();
      expect(definition.biomes).toContain("hearthmere");
    }
  });

  it("enemy entries all carry a valid enemy tag", () => {
    const enemies = HEARTHMERE_PLACEMENTS.filter((p) => p.type === "enemy");

    expect(enemies.length).toBeGreaterThan(0);

    for (const p of enemies) {
      const definition = getEnemyDefinitionForPlacementTags(p.tags);
      expect(definition).not.toBeNull();
      expect(definition.biomes).toContain("hearthmere");
    }
  });

  it("prefab entries all carry a tag that exists in PrefabCatalogue", () => {
    const prefabs = HEARTHMERE_PLACEMENTS.filter((p) => p.type === "prefab");

    expect(prefabs.length).toBeGreaterThan(0);

    for (const p of prefabs) {
      const hasValidTag = p.tags.some((t) => VALID_PREFAB_TAGS.has(t));
      expect(hasValidTag).toBe(true);
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

  it("getContentForChunk for the chunk containing (42,28) returns the camp prefab", () => {
    // camp prefab is at origin x=42, z=28; CHUNK_SIZE=32 → chunkX=1, chunkZ=0
    const region = new HearthmereRegion();
    const content = region.getContentForChunk(1, 0);

    expect(content).not.toBeNull();

    const ids = content.placements.map((p) => p.id);
    expect(ids).toContain("hearthmere.prefab.camp");
  });
});
