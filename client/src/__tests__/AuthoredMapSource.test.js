import { describe, expect, it } from "@jest/globals";
import { AuthoredMapSource } from "../world/authored/AuthoredMapSource.js";
import {
  HEARTHMERE_REGION_BOUNDS,
  HEARTHMERE_SPAWN_POINT
} from "../world/regions/hearthmere/HearthmereRegion.js";

describe("AuthoredMapSource", () => {
  it("exposes terrain-pipeline biome and non-flat height aliases for Hearthmere", () => {
    const source = new AuthoredMapSource();
    const sampleX = 312.5;
    const sampleZ = 250;
    const basinHeight = source.heightAt(0, 0);
    const ridgeHeight = source.heightAt(2500, 2000);
    const height = source.heightAt(sampleX, sampleZ);
    const region = source.getRegion("hearthmere");

    expect(Number.isFinite(height)).toBe(true);
    expect(source.getHeightAt(sampleX, sampleZ)).toBeCloseTo(height, 6);
    expect(source.sampleHeight(sampleX, sampleZ)).toBeCloseTo(height, 6);
    expect(source.normalizedHeightAt(sampleX, sampleZ)).toBeCloseTo(region?.normalizedHeightAt(sampleX, sampleZ), 6);
    expect(ridgeHeight).toBeGreaterThan(basinHeight);

    expect(source.biomeAt(0, 3)?.id).toBe("hearthmere");
    expect(source.getBiomeAt(0, 3)?.id).toBe("hearthmere");
    expect(source.sampleBiome(0, 3)?.id).toBe("hearthmere");
    expect(source.sampleBiomeId(0, 3)).toBe("hearthmere");
    expect(source.sampleBiomeBlend(0, 3)?.id).toBe("hearthmere");
  });

  it("exposes the authored Hearthmere spawn point", () => {
    const source = new AuthoredMapSource();

    expect(source.getSpawnPoint()).toEqual(HEARTHMERE_SPAWN_POINT);
    expect(source.getSpawnPoint("hearthmere")).toEqual(HEARTHMERE_SPAWN_POINT);
    expect(source.getSpawnPoint("missing")).toBeNull();
  });

  it("returns authored placements by chunk when content is present", () => {
    const source = new AuthoredMapSource();
    // Spawn chunk (0,0) contains at least the two origin landmarks
    const spawnChunkContent = source.getContentForChunk(0, 0);
    const spawnIds = spawnChunkContent.placements.map(({ id }) => id);

    expect(spawnChunkContent).not.toBeNull();
    expect(spawnIds).toContain("hearthmere.player_spawn");
    expect(spawnIds).toContain("hearthmere.campfire");

    // Watchtower is now at (640, -320) → chunk (20, -10)
    const watchtowerChunkPlacements = source.getPlacementsForChunk(20, -10);
    expect(watchtowerChunkPlacements.map(({ id }) => id)).toContain("hearthmere.watchtower");

    // South gate is now at (0, 1600) → chunk (0, 50)
    const southGateChunkPlacements = source.getChunkPlacements(0, 50);
    expect(southGateChunkPlacements.map(({ id }) => id)).toContain("hearthmere.south_gate");
  });

  it("exposes typed authored placement buckets from the spatial index", () => {
    const source = new AuthoredMapSource();

    expect(source.getResourcesForChunk(43, 0).map(({ id }) => id)).toContain("hearthmere.res.ore_a.0");
    expect(source.getEnemiesForChunk(-50, 9).map(({ id }) => id)).toContain("hearthmere.enemy.shambler_crypt.0");
    expect(source.getPrefabsForChunk(1, 0).map(({ id }) => id)).toContain("hearthmere.prefab.camp");
    expect(source.getNpcsForChunk(0, 0).map(({ id }) => id)).toContain("hearthmere.npc.tessa_forge");

    const resourceContent = source.getContentForChunk(43, 0);
    expect(resourceContent.resources.map(({ id }) => id)).toContain("hearthmere.res.ore_a.0");
    expect(resourceContent.enemies).toEqual([]);
  });

  it("keeps authored content queries empty outside populated chunks and null outside bounds", () => {
    const source = new AuthoredMapSource();

    expect(source.getContentForChunk(9, 9)).toBeNull();
    expect(source.getPlacementsForChunk(9, 9)).toEqual([]);
    expect(source.findRegionAt(2600, 0)).toBeNull();
    expect(source.sampleBiomeId(2600, 0)).toBeNull();
    expect(source.heightAt(0, 2100)).toBeNull();
  });

  it("returns null biome for coordinates outside all regions", () => {
    const source = new AuthoredMapSource();

    expect(source.biomeAt(9000, 9000)).toBeNull();
    expect(source.getBiomeAt(9000, 9000)).toBeNull();
    expect(source.sampleBiome(9000, 9000)).toBeNull();
    expect(source.sampleBiomeId(9000, 9000)).toBeNull();
    expect(source.sampleBiomeBlend(9000, 9000)).toBeNull();
  });

  it("clamps terrain biome sampling at authored region boundaries without changing null biome contracts", () => {
    const source = new AuthoredMapSource();
    const edgeX = HEARTHMERE_REGION_BOUNDS.maxX;
    const edgeBiome = source.sampleBiomeBlend(edgeX, 0);

    expect(edgeBiome).not.toBeNull();
    expect(source.biomeAt(edgeX + 0.1, 0)).toBeNull();
    expect(source.sampleBiomeBlend(edgeX + 0.1, 0)).toBeNull();
    expect(source.terrainBiomeAt(edgeX + 0.1, 0)).toEqual(edgeBiome);
  });

  it("returns null height for coordinates outside all regions", () => {
    const source = new AuthoredMapSource();

    expect(source.heightAt(9000, 9000)).toBeNull();
    expect(source.getHeightAt(9000, 9000)).toBeNull();
    expect(source.sampleHeight(9000, 9000)).toBeNull();
  });
});
