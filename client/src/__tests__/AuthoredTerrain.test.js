import { describe, expect, it } from "@jest/globals";
import { AuthoredMapSource } from "../world/authored/AuthoredMapSource.js";
import { TerrainGenerator } from "../world/gen/TerrainGenerator.js";
import { terrainSampleAt } from "../world/gen/heightField.js";
import { CHUNK_SEGS, CHUNK_SIZE, WORLD_SEED_DEFAULT } from "../world/gen/WorldConfig.js";
import { HEARTHMERE_REGION_BOUNDS } from "../world/regions/hearthmere/HearthmereRegion.js";

describe("authored terrain source", () => {
  const seed = WORLD_SEED_DEFAULT;

  it("feeds Hearthmere authored height and biome data into terrain samples", () => {
    const source = new AuthoredMapSource();
    const sampleX = 312.5;
    const sampleZ = 250;
    const sample = terrainSampleAt(sampleX, sampleZ, seed, source, null, source);
    const expectedHeight = source.heightAt(sampleX, sampleZ);

    expect(sample.baseHeight).toBeCloseTo(expectedHeight, 6);
    expect(sample.height).toBeCloseTo(expectedHeight, 6);
    expect(sample.normalizedHeight).toBeCloseTo(source.normalizedHeightAt(sampleX, sampleZ), 6);
    expect(source.heightAt(2500, 2000) - source.heightAt(0, 0)).toBeGreaterThan(10);
    expect(sample.biome.key).toBe("hearthmere");
  });

  it("keeps generated authored chunks seam-safe", () => {
    const source = new AuthoredMapSource();
    const generator = new TerrainGenerator(seed, {
      biomeSource: source,
      heightSource: source
    });
    const left = generator.generateChunk(0, 0);
    const right = generator.generateChunk(1, 0);
    const vertsPerSide = CHUNK_SEGS + 1;

    expect(left.centerBiome.key).toBe("hearthmere");
    expect(right.centerBiome.key).toBe("hearthmere");

    for (let iz = 0; iz <= CHUNK_SEGS; iz += 1) {
      const leftPointer = (iz * vertsPerSide + CHUNK_SEGS) * 3;
      const rightPointer = (iz * vertsPerSide) * 3;
      const worldZ = 0.5 * CHUNK_SIZE + (iz / CHUNK_SEGS - 0.5) * CHUNK_SIZE;
      const expectedHeight = source.heightAt(CHUNK_SIZE, worldZ);

      expect(left.colliderVertices[leftPointer + 1]).toBeCloseTo(expectedHeight, 6);
      expect(right.colliderVertices[rightPointer + 1]).toBeCloseTo(expectedHeight, 6);
      expect(left.colliderVertices[leftPointer + 1]).toBe(right.colliderVertices[rightPointer + 1]);
    }

    const leftHeights = [];
    for (let pointer = 1; pointer < left.colliderVertices.length; pointer += 3) {
      leftHeights.push(left.colliderVertices[pointer]);
    }
    expect(Math.max(...leftHeights)).toBeGreaterThan(Math.min(...leftHeights));

    left.geometry.dispose();
    right.geometry.dispose();
  });

  it("uses boundary-clamped render terrain outside authored coverage without changing source null contracts", () => {
    const source = new AuthoredMapSource();
    const edgeX = HEARTHMERE_REGION_BOUNDS.maxX;
    const edgeSample = terrainSampleAt(edgeX, 0, seed, source, null, source);
    const justOutsideSample = terrainSampleAt(edgeX + 0.1, 0, seed, source, null, source);

    expect(source.heightAt(edgeX + 0.1, 0)).toBeNull();
    expect(source.biomeAt(edgeX + 0.1, 0)).toBeNull();
    expect(justOutsideSample.height).toBeCloseTo(edgeSample.height, 6);
    expect(justOutsideSample.biome._zoneId).toBe(edgeSample.biome._zoneId);
    expect(justOutsideSample.biome._maskWeights).toEqual(edgeSample.biome._maskWeights);
    expect(justOutsideSample.biome.palette).toEqual(edgeSample.biome.palette);
    expect(justOutsideSample.biome.atmosphere).toEqual(edgeSample.biome.atmosphere);
  });
});
