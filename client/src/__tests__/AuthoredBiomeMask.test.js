import { describe, expect, it } from "@jest/globals";
import { loadAuthoredBiomeMask } from "../world/authored/AuthoredBiomeMask.js";

const BASE_BIOME = Object.freeze({
  id: "hearthmere",
  name: "Hearthmere",
  groundColor: "#000000",
  accentColor: "#202020",
  backgroundColor: "#101010",
  fogColor: "#000000",
  fogDensity: 0.1,
  terrainAmplitude: 4,
  terrainBaseHeight: 1,
  roughness: 0.9,
  metalness: 0.1,
  musicId: "music.biome.hearthmere",
  resourceTableId: "resources.biome.hearthmere",
  enemyTableId: "enemies.biome.hearthmere"
});

describe("AuthoredBiomeMask", () => {
  it("decodes authored mask samples into stable bounds, dimensions, and immutable sub-biome channels", () => {
    const mask = loadAuthoredBiomeMask({
      id: "test.mask",
      bounds: { minX: 0, maxX: 10, minZ: 0, maxZ: 10 },
      samples: [
        ["ridge", "fen"],
        [null, "fen"]
      ],
      subBiomes: {
        ridge: { fogDensity: 0, groundColor: "#ff0000" },
        fen: { fogDensity: 1, groundColor: "#00ff00" }
      }
    });

    expect(mask.id).toBe("test.mask");
    expect(mask.bounds).toEqual({ minX: 0, maxX: 10, minZ: 0, maxZ: 10 });
    expect(mask.width).toBe(2);
    expect(mask.height).toBe(2);
    expect(Object.isFrozen(mask.subBiomes.ridge)).toBe(true);
  });

  it("bilinearly blends neighboring mask texels so midpoint weights interpolate smoothly", () => {
    const mask = loadAuthoredBiomeMask({
      bounds: { minX: 0, maxX: 10, minZ: 0, maxZ: 10 },
      samples: [
        ["ridge", "fen"],
        [null, "fen"]
      ],
      subBiomes: {
        ridge: { fogDensity: 0, groundColor: "#ff0000" },
        fen: { fogDensity: 1, groundColor: "#00ff00" }
      }
    });
    const weights = mask.sampleWeights(5, 5);
    const biome = mask.biomeAt(BASE_BIOME, 5, 5);

    expect(weights.ridge).toBeCloseTo(0.25, 6);
    expect(weights.fen).toBeCloseTo(0.5, 6);
    expect(mask.sampleDominantId(5, 5)).toBe("fen");
    expect(biome.id).toBe(BASE_BIOME.id);
    expect(biome.fogDensity).toBeCloseTo(0.525, 6);
    expect(biome.groundColor).toBe("#408000");
    expect(biome).toHaveProperty("resourceTableId", BASE_BIOME.resourceTableId);
  });

  it("supports discrete mask sampling without cross-cell bleed at texel boundaries", () => {
    const mask = loadAuthoredBiomeMask({
      bounds: { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
      palette: { 1: "ridge", 2: "fen" },
      samples: [
        [1, 2],
        [1, 2]
      ],
      subBiomes: {
        ridge: { fogDensity: 0.2 },
        fen: { fogDensity: 0.8 }
      }
    });

    expect(mask.sampleDominantId(0, 0)).toBe("ridge");
    expect(mask.sampleDominantId(1, 0)).toBe("fen");
  });

  it("normalizes overweight explicit channel samples into convex mask weights", () => {
    const sample = Object.freeze({
      ridge: 3,
      fen: 1,
      hollow: -2,
      ash: Number.NaN
    });
    const mask = loadAuthoredBiomeMask({
      bounds: { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
      samples: [
        [sample, sample],
        [sample, sample]
      ],
      subBiomes: {
        ridge: { fogDensity: 0, groundColor: "#ff0000" },
        fen: { fogDensity: 1, groundColor: "#00ff00" }
      }
    });
    const weights = mask.sampleWeights(0.5, 0.5);

    expect(weights.ridge).toBeCloseTo(0.75, 6);
    expect(weights.fen).toBeCloseTo(0.25, 6);
    expect(weights.hollow).toBeUndefined();
    expect(weights.ash).toBeUndefined();
    expect(Object.values(weights).reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1, 6);
  });

  it("falls back to the base biome when a region sample lands outside authored mask coverage", () => {
    const mask = loadAuthoredBiomeMask({
      bounds: { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
      samples: [
        [null, null],
        [null, null]
      ],
      subBiomes: {
        ridge: { fogDensity: 0.2 }
      }
    });

    expect(mask.sampleWeights(2, 0)).toBeNull();
    expect(mask.biomeAt(BASE_BIOME, 0.5, 0.5)).toBeNull();
  });

  it("preserves the full BiomeDef payload when sub-biome overlays replace only selected fields", () => {
    const mask = loadAuthoredBiomeMask({
      bounds: { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
      samples: [
        ["ridge", "ridge"],
        ["ridge", "ridge"]
      ],
      subBiomes: {
        ridge: { fogDensity: 0.2, groundColor: "#ffffff" }
      }
    });
    const biome = mask.biomeAt(BASE_BIOME, 0, 0);

    expect(biome).toHaveProperty("id", BASE_BIOME.id);
    expect(biome).toHaveProperty("musicId", BASE_BIOME.musicId);
    expect(biome).toHaveProperty("resourceTableId", BASE_BIOME.resourceTableId);
    expect(biome).toHaveProperty("enemyTableId", BASE_BIOME.enemyTableId);
    expect(biome.fogDensity).toBe(0.2);
    expect(biome.groundColor).toBe("#ffffff");
  });

  it("blends valid sub-biome colors even when the base biome color is invalid", () => {
    const mask = loadAuthoredBiomeMask({
      bounds: { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
      samples: [
        ["ridge", "fen"],
        ["ridge", "fen"]
      ],
      subBiomes: {
        ridge: { groundColor: "#ff0000" },
        fen: { groundColor: "#00ff00" }
      }
    });
    const biome = mask.biomeAt({
      ...BASE_BIOME,
      groundColor: "not-a-color"
    }, 0.5, 0.5);

    expect(biome.groundColor).toBe("#808000");
  });
});
