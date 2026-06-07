import { describe, expect, it, jest } from "@jest/globals";
import { AuthoredMapSource } from "../world/authored/AuthoredMapSource.js";
import { TerrainGenerator } from "../world/gen/TerrainGenerator.js";
import { normaliseBiome, resolveBiomeAt, terrainHeightAt } from "../world/gen/heightField.js";
import { CHUNK_SEGS, CHUNK_SIZE, WORLD_SEED_DEFAULT } from "../world/gen/WorldConfig.js";
import { PREFAB_IDS, PrefabRegistry } from "../world/prefab/PrefabRegistry.js";

describe("biome-aware terrain", () => {
  const seed = WORLD_SEED_DEFAULT;
  const biomeSource = new AuthoredMapSource();

  const edgeWorldX = (cx, ix) => (cx + 0.5) * CHUNK_SIZE + (ix / CHUNK_SEGS - 0.5) * CHUNK_SIZE;

  it("keeps shared chunk-edge heights identical with biome sampling enabled", () => {
    for (let iz = 0; iz <= CHUNK_SEGS; iz += 1) {
      const worldZ = 0.5 * CHUNK_SIZE + (iz / CHUNK_SEGS - 0.5) * CHUNK_SIZE;
      const leftHeight = terrainHeightAt(edgeWorldX(0, CHUNK_SEGS), worldZ, seed, biomeSource, null, biomeSource);
      const rightHeight = terrainHeightAt(edgeWorldX(1, 0), worldZ, seed, biomeSource, null, biomeSource);

      expect(leftHeight).toBe(rightHeight);
    }
  });

  it("avoids verifier-found height cliffs at adjacent authored-boundary samples", () => {
    const leftHeight = terrainHeightAt(465, -587, seed, biomeSource, null, biomeSource);
    const rightHeight = terrainHeightAt(466, -587, seed, biomeSource, null, biomeSource);

    expect(Math.abs(leftHeight - rightHeight)).toBeLessThan(1);
  });

  it("generates matching visual and collider edge vertices", () => {
    const generator = new TerrainGenerator(seed, { biomeSource, heightSource: biomeSource });
    const left = generator.generateChunk(0, 0);
    const right = generator.generateChunk(1, 0);
    const vertsPerSide = CHUNK_SEGS + 1;

    for (let iz = 0; iz <= CHUNK_SEGS; iz += 1) {
      const leftPointer = (iz * vertsPerSide + CHUNK_SEGS) * 3;
      const rightPointer = (iz * vertsPerSide) * 3;

      expect(left.colliderVertices[leftPointer + 1]).toBe(right.colliderVertices[rightPointer + 1]);
    }

    expect(left.geometry.getAttribute("color").count).toBe(left.geometry.getAttribute("position").count);
    left.geometry.dispose();
    right.geometry.dispose();
  });

  it("keeps prefab-flattened terrain seam-safe across generated chunks", () => {
    const prefabSource = new PrefabRegistry(seed, { biomeSource, heightSource: biomeSource });
    const anchor = prefabSource.getAnchorById(PREFAB_IDS.HEARTHMERE_CAMP);
    const cx = Math.floor(anchor.origin.x / CHUNK_SIZE);
    const cz = Math.floor(anchor.origin.z / CHUNK_SIZE);
    const generator = new TerrainGenerator(seed, { biomeSource, heightSource: biomeSource, prefabSource });
    const left = generator.generateChunk(cx, cz);
    const right = generator.generateChunk(cx + 1, cz);
    const vertsPerSide = CHUNK_SEGS + 1;

    for (let iz = 0; iz <= CHUNK_SEGS; iz += 1) {
      const leftPointer = (iz * vertsPerSide + CHUNK_SEGS) * 3;
      const rightPointer = (iz * vertsPerSide) * 3;

      expect(left.colliderVertices[leftPointer + 1]).toBe(right.colliderVertices[rightPointer + 1]);
    }

    const flattenedCenter = terrainHeightAt(anchor.origin.x, anchor.origin.z, seed, biomeSource, prefabSource, biomeSource);
    expect(flattenedCenter).toBeCloseTo(anchor.padHeight, 6);
    left.geometry.dispose();
    right.geometry.dispose();
  });

  it("prefers sampleBiomeBlend over getBiomeAt when both biome APIs exist", () => {
    const source = {
      sampleBiomeBlend: jest.fn(() => ({
        id: "blend",
        name: "Blend",
        groundColor: "#345678",
        fogColor: "#112233",
        fogDensity: 0.047
      })),
      getBiomeAt: jest.fn(() => ({
        id: "direct",
        name: "Direct",
        groundColor: "#000000",
        fogColor: "#ffffff",
        fogDensity: 0.5
      }))
    };

    const biome = resolveBiomeAt(12, 34, source);

    expect(source.sampleBiomeBlend).toHaveBeenCalledWith(12, 34);
    expect(source.getBiomeAt).not.toHaveBeenCalled();
    expect(biome.id).toBe("blend");
    expect(biome.palette.low).toBe("#345678");
    expect(biome.atmosphere.fogColor).toBe("#112233");
  });

  it("preserves biome metadata while exposing normalised terrain, palette, and atmosphere fields", () => {
    const rawBiome = Object.freeze({
      id: "hearthmere",
      name: "Hearthmere Outpost",
      groundColor: "#4f4733",
      accentColor: "#b78962",
      backgroundColor: "#080706",
      fogColor: "#141009",
      fogDensity: 0.03,
      terrainAmplitude: 4.5,
      terrainBaseHeight: 1.5,
      resourceTableId: "resources.biome.hearthmere",
      enemyTableId: "enemies.biome.hearthmere",
      _zoneId: "hearthmere.fen",
      _maskWeights: Object.freeze({
        "hearthmere.ashfall_road": 0.25,
        "hearthmere.fen": 0.75
      })
    });

    const biome = normaliseBiome(rawBiome);

    expect(biome.id).toBe(rawBiome.id);
    expect(biome.resourceTableId).toBe(rawBiome.resourceTableId);
    expect(biome.enemyTableId).toBe(rawBiome.enemyTableId);
    expect(biome._zoneId).toBe(rawBiome._zoneId);
    expect(biome._maskWeights).toBe(rawBiome._maskWeights);
    expect(biome.key).toBe("hearthmere");
    expect(biome.terrain).toEqual({
      amplitude: 4.5,
      baseHeight: 1.5
    });
    expect(biome.palette).toEqual({
      low: "#4f4733",
      high: "#b78962"
    });
    expect(biome.atmosphere).toEqual({
      background: "#080706",
      fogColor: "#141009",
      fogDensity: 0.03
    });
  });
});
