import { describe, expect, it } from "@jest/globals";
import {
  AUTHORED_WORLD_BOUNDS,
  AUTHORED_WORLD_DEPTH,
  AUTHORED_WORLD_HALF_DEPTH,
  AUTHORED_WORLD_HALF_WIDTH,
  AUTHORED_WORLD_WIDTH,
  RegionBase
} from "../world/regions/_RegionBase.js";
import { RegionRegistry, createDefaultRegionRegistry } from "../world/regions/RegionRegistry.js";
import {
  HEARTHMERE_REGION_BOUNDS,
  HEARTHMERE_SPAWN_POINT
} from "../world/regions/hearthmere/HearthmereRegion.js";

describe("RegionRegistry", () => {
  it("defines the authored world as a 10,000 x 10,000 space", () => {
    expect(AUTHORED_WORLD_WIDTH).toBe(10000);
    expect(AUTHORED_WORLD_DEPTH).toBe(10000);
    expect(AUTHORED_WORLD_HALF_WIDTH).toBe(5000);
    expect(AUTHORED_WORLD_HALF_DEPTH).toBe(5000);
    expect(AUTHORED_WORLD_BOUNDS).toEqual({
      minX: -5000,
      maxX: 5000,
      minZ: -5000,
      maxZ: 5000
    });
  });

  it("registers Hearthmere first with the WM-01 bounds and spawn", () => {
    const registry = createDefaultRegionRegistry();
    const [hearthmere] = registry.getRegions();

    expect(hearthmere.id).toBe("hearthmere");
    expect(hearthmere.bounds).toEqual(HEARTHMERE_REGION_BOUNDS);
    expect(hearthmere.spawn).toEqual(HEARTHMERE_SPAWN_POINT);
    expect(registry.getSpawnPoint()).toEqual(HEARTHMERE_SPAWN_POINT);
    expect(registry.getSpawnPoint("hearthmere")).toEqual(HEARTHMERE_SPAWN_POINT);
    expect(registry.getSpawnPoint("missing")).toBeNull();
  });

  it("returns a cloned spawn point so callers cannot mutate region metadata", () => {
    const registry = createDefaultRegionRegistry();
    const spawn = registry.getSpawnPoint("hearthmere");

    expect(spawn).toEqual(HEARTHMERE_SPAWN_POINT);
    expect(spawn).not.toBe(registry.getRegion("hearthmere").spawn);
    expect(Object.isFrozen(spawn)).toBe(true);
  });

  it("resolves Hearthmere biome and authored heightmap data inside bounds", () => {
    const registry = new RegionRegistry();
    const region = registry.getRegion("hearthmere");
    const heightSource = region?.terrain?.heightSource;
    const sampleX = 312.5;
    const sampleZ = 250;
    const centerHeight = registry.heightAt(0, 0);
    const foothillHeight = registry.getHeightAt(sampleX, sampleZ);
    const ridgeHeight = registry.heightAt(2500, 2000);

    expect(Number.isFinite(centerHeight)).toBe(true);
    expect(heightSource).not.toBeNull();
    expect(foothillHeight).toBeCloseTo(heightSource?.heightAt(sampleX, sampleZ), 6);
    expect(registry.sampleHeight(sampleX, sampleZ)).toBeCloseTo(foothillHeight, 6);
    expect(registry.normalizedHeightAt(sampleX, sampleZ)).toBeCloseTo(region?.normalizedHeightAt(sampleX, sampleZ), 6);
    expect(ridgeHeight - centerHeight).toBeGreaterThan(10);
    expect(registry.sampleBiomeId(0, 3)).toBe("hearthmere");
    expect(registry.biomeAt(0, 3)?.id).toBe("hearthmere");
    expect(registry.getBiomeAt(2500, 2000)?.id).toBe("hearthmere");
    expect(registry.sampleBiomeBlend(-100, 100)?.id).toBe("hearthmere");
  });

  it("returns null outside the Hearthmere authored bounds", () => {
    const registry = new RegionRegistry();

    expect(registry.findRegionAt(2501, 0)).toBeNull();
    expect(registry.findRegionAt(0, 2001)).toBeNull();
    expect(registry.heightAt(3000, 0)).toBeNull();
    expect(registry.normalizedHeightAt(3000, 0)).toBeNull();
    expect(registry.sampleBiomeId(-2600, 0)).toBeNull();
    expect(registry.sampleBiomeBlend(0, -2501)).toBeNull();
  });

  it("rejects placements outside their owning region bounds", () => {
    expect(() => new RegionBase({
      id: "test_region",
      bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
      biome: { id: "hearthmere", name: "Hearthmere" },
      placements: [
        { id: "outside", type: "npc", origin: { x: 200, y: 0, z: 200 } }
      ]
    })).toThrow(RangeError);
  });
});
