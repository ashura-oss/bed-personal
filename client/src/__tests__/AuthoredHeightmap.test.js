import { describe, expect, it } from "@jest/globals";
import { loadAuthoredHeightmap } from "../world/authored/AuthoredHeightmap.js";
import { CHUNK_SEGS, CHUNK_SIZE } from "../world/gen/WorldConfig.js";
import { createHearthmereHeightmap } from "../world/regions/hearthmere/heightmap.js";

const edgeWorldX = (cx, ix) => (cx + 0.5) * CHUNK_SIZE + (ix / CHUNK_SEGS - 0.5) * CHUNK_SIZE;

describe("AuthoredHeightmap", () => {
  it("bilinearly samples macro heights across the authored grid", () => {
    const heightmap = loadAuthoredHeightmap({
      id: "test.heightmap",
      bounds: {
        minX: 0,
        maxX: 2,
        minZ: 0,
        maxZ: 2
      },
      samples: [
        [0, 10],
        [20, 30]
      ]
    });

    expect(heightmap.macroHeightAt(0, 0)).toBe(0);
    expect(heightmap.macroHeightAt(2, 0)).toBe(10);
    expect(heightmap.macroHeightAt(0, 2)).toBe(20);
    expect(heightmap.macroHeightAt(2, 2)).toBe(30);
    expect(heightmap.macroHeightAt(1, 0)).toBe(5);
    expect(heightmap.macroHeightAt(0, 1)).toBe(10);
    expect(heightmap.macroHeightAt(1, 1)).toBe(15);
    expect(heightmap.heightAt(1, 1)).toBe(15);
    expect(heightmap.normalizedHeightAt(1, 1)).toBeCloseTo(0.5, 6);
  });

  it("returns null outside authored bounds", () => {
    const heightmap = loadAuthoredHeightmap({
      id: "test.heightmap",
      bounds: {
        minX: 0,
        maxX: 2,
        minZ: 0,
        maxZ: 2
      },
      samples: [
        [0, 10],
        [20, 30]
      ]
    });

    expect(heightmap.macroHeightAt(-0.01, 1)).toBeNull();
    expect(heightmap.heightAt(1, 2.01)).toBeNull();
    expect(heightmap.normalizedHeightAt(2.01, 1)).toBeNull();
  });

  it("does not expand normalized range when detail noise is disabled by frequency", () => {
    const heightmap = loadAuthoredHeightmap({
      id: "test.heightmap",
      bounds: {
        minX: 0,
        maxX: 2,
        minZ: 0,
        maxZ: 2
      },
      samples: [
        [0, 10],
        [0, 10]
      ],
      detail: {
        amplitude: 5,
        frequency: 0,
        octaves: 2,
        seed: 99
      }
    });

    expect(heightmap.minHeight).toBe(0);
    expect(heightmap.maxHeight).toBe(10);
    expect(heightmap.normalizedHeightAt(0, 0)).toBe(0);
    expect(heightmap.normalizedHeightAt(2, 0)).toBe(1);
  });

  it("adds deterministic seam-safe detail on top of Hearthmere macro heights", () => {
    const heightmap = createHearthmereHeightmap();
    const detailDeltas = [
      [137.25, -412.5],
      [624.5, -187.5],
      [-911.75, 333.125]
    ].map(([worldX, worldZ]) => Math.abs(heightmap.heightAt(worldX, worldZ) - heightmap.macroHeightAt(worldX, worldZ)));

    expect(heightmap.heightAt(137.25, -412.5)).toBe(heightmap.heightAt(137.25, -412.5));
    expect(detailDeltas.some((delta) => delta > 1e-6)).toBe(true);

    for (let iz = 0; iz <= CHUNK_SEGS; iz += 1) {
      const worldZ = 0.5 * CHUNK_SIZE + (iz / CHUNK_SEGS - 0.5) * CHUNK_SIZE;
      expect(heightmap.heightAt(edgeWorldX(0, CHUNK_SEGS), worldZ)).toBe(heightmap.heightAt(edgeWorldX(1, 0), worldZ));
    }
  });
});
