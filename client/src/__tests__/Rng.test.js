import { describe, expect, it } from "@jest/globals";
import { fbm, hash2, lerp, mulberry32, smootherstep, valueNoise2D } from "../world/gen/Rng.js";
import { terrainHeightAt } from "../world/gen/heightField.js";
import { CHUNK_SEGS, CHUNK_SIZE } from "../world/gen/WorldConfig.js";

describe("lerp", () => {
  it("interpolates endpoints", () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe("smootherstep", () => {
  it("pins 0 and 1", () => {
    expect(smootherstep(0)).toBe(0);
    expect(smootherstep(1)).toBe(1);
  });

  it("is 0.5 at the midpoint", () => {
    expect(smootherstep(0.5)).toBeCloseTo(0.5, 6);
  });

  it("is monotonic across the unit interval", () => {
    let prev = -Infinity;

    for (let t = 0; t <= 1.0001; t += 0.05) {
      const value = smootherstep(t);
      expect(value).toBeGreaterThanOrEqual(prev);
      prev = value;
    }
  });
});

describe("mulberry32 determinism", () => {
  it("same seed produces the same sequence", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);

    for (let index = 0; index < 100; index += 1) {
      expect(a()).toBe(b());
    }
  });

  it("different seeds diverge", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let anyDifferent = false;

    for (let index = 0; index < 10; index += 1) {
      if (a() !== b()) anyDifferent = true;
    }

    expect(anyDifferent).toBe(true);
  });

  it("outputs lie in [0, 1)", () => {
    const random = mulberry32(99);

    for (let index = 0; index < 1000; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("hash2 determinism", () => {
  it("same inputs give the same hash", () => {
    expect(hash2(3, 7, 1337)).toBe(hash2(3, 7, 1337));
  });

  it("different coords give different hashes (almost always)", () => {
    expect(hash2(3, 7, 1337)).not.toBe(hash2(4, 7, 1337));
    expect(hash2(3, 7, 1337)).not.toBe(hash2(3, 8, 1337));
  });

  it("different seeds give different hashes", () => {
    expect(hash2(3, 7, 1)).not.toBe(hash2(3, 7, 2));
  });

  it("outputs lie in [0, 1)", () => {
    for (let x = -5; x <= 5; x += 1) {
      for (let z = -5; z <= 5; z += 1) {
        const value = hash2(x, z, 7);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    }
  });
});

describe("valueNoise2D", () => {
  it("is deterministic for the same coords + seed", () => {
    expect(valueNoise2D(12.3, -4.5, 1337)).toBe(valueNoise2D(12.3, -4.5, 1337));
  });

  it("returns lattice hash exactly at integer points", () => {
    // At integer coords the bilinear blend collapses to the corner hash.
    expect(valueNoise2D(5, 9, 1337)).toBeCloseTo(hash2(5, 9, 1337), 6);
  });

  it("stays within [0, 1]", () => {
    for (let index = 0; index < 200; index += 1) {
      const value = valueNoise2D(index * 0.37, index * -0.91, 4242);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("fbm", () => {
  it("is deterministic", () => {
    expect(fbm(10, 20, 1337)).toBe(fbm(10, 20, 1337));
  });

  it("different seeds produce different fields", () => {
    expect(fbm(10, 20, 1)).not.toBe(fbm(10, 20, 2));
  });

  it("stays within [0, 1]", () => {
    for (let index = 0; index < 200; index += 1) {
      const value = fbm(index * 1.7, index * -2.3, 1337, { octaves: 5 });
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("terrain seam safety", () => {
  const seed = 1337;

  // Reproduce TerrainGenerator's per-vertex world-coord computation:
  // chunk (cx) center = (cx + 0.5) * CHUNK_SIZE; vertex ix has lx = (ix/segs - 0.5) * CHUNK_SIZE.
  const edgeWorldX = (cx, ix) => (cx + 0.5) * CHUNK_SIZE + (ix / CHUNK_SEGS - 0.5) * CHUNK_SIZE;

  it("adjacent chunks compute the same boundary world-X independently", () => {
    // Chunk (0,0)'s right edge (ix = CHUNK_SEGS) and chunk (1,0)'s left edge (ix = 0)
    // are the SAME world column. The two expressions must converge exactly.
    const fromLeftChunk = edgeWorldX(0, CHUNK_SEGS);
    const fromRightChunk = edgeWorldX(1, 0);
    expect(fromLeftChunk).toBe(fromRightChunk);
    expect(fromLeftChunk).toBe(CHUNK_SIZE);
  });

  it("shared boundary vertices produce identical heights (no seam, no fall-through)", () => {
    // Walk every vertex along the shared edge between chunk (0,0) and (1,0).
    // Each is computed via BOTH chunks' independent center+lx expressions;
    // heights must match to the bit, or the player could fall through a seam.
    for (let iz = 0; iz <= CHUNK_SEGS; iz += 1) {
      const worldZ = 0.5 * CHUNK_SIZE + (iz / CHUNK_SEGS - 0.5) * CHUNK_SIZE;
      const leftHeight = terrainHeightAt(edgeWorldX(0, CHUNK_SEGS), worldZ, seed);
      const rightHeight = terrainHeightAt(edgeWorldX(1, 0), worldZ, seed);
      expect(leftHeight).toBe(rightHeight);
    }
  });

  it("terrain height is deterministic for the same seed", () => {
    expect(terrainHeightAt(12.5, -7.25, seed)).toBe(terrainHeightAt(12.5, -7.25, seed));
  });

  it("returns flat base height when no height source is provided (authored-only world)", () => {
    // Without an authored height source the procedural fBm path is gone;
    // the out-of-bounds fallback returns biome.terrain.baseHeight (0 by default).
    expect(terrainHeightAt(12.5, -7.25, 1)).toBe(0);
    expect(terrainHeightAt(12.5, -7.25, 2)).toBe(0);
  });
});
