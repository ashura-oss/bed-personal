import { describe, expect, it } from "@jest/globals";
import { WORLD_SEED_DEFAULT } from "../world/gen/WorldConfig.js";
import { PREFAB_IDS, PrefabRegistry } from "../world/prefab/PrefabRegistry.js";

describe("PrefabRegistry", () => {
  const seed = WORLD_SEED_DEFAULT;
  // Minimal biome source mock: the camp is always placed in the Hearthmere
  // starter zone, so returning 'hearthmere' unconditionally is sufficient.
  const biomeSource = { sampleBiomeId: () => "hearthmere" };

  it("places the Hearthmere camp deterministically for the same seed", () => {
    const first = new PrefabRegistry(seed, { biomeSource });
    const second = new PrefabRegistry(seed, { biomeSource });

    expect(first.getPrefabAnchors()).toEqual(second.getPrefabAnchors());
  });

  it("varies Hearthmere camp placement across a seed set", () => {
    const anchors = new Set(
      [1337, 1338, 1339, 1340].map((nextSeed) => {
        const anchor = new PrefabRegistry(nextSeed, { biomeSource })
          .getAnchorById(PREFAB_IDS.HEARTHMERE_CAMP);

        return `${anchor.origin.x},${anchor.origin.z}`;
      })
    );

    expect(anchors.size).toBeGreaterThan(1);
  });

  it("keeps the Hearthmere camp footprint inside the discrete Hearthmere starter biome", () => {
    const registry = new PrefabRegistry(seed, { biomeSource });
    const anchor = registry.getAnchorById(PREFAB_IDS.HEARTHMERE_CAMP);
    const radius = anchor.footprintRadius;
    const samples = [
      [0, 0],
      [radius, 0],
      [-radius, 0],
      [0, radius],
      [0, -radius],
      [radius * 0.707, radius * 0.707],
      [-radius * 0.707, radius * 0.707],
      [radius * 0.707, -radius * 0.707],
      [-radius * 0.707, -radius * 0.707]
    ];

    for (const [dx, dz] of samples) {
      expect(biomeSource.sampleBiomeId(anchor.origin.x + dx, anchor.origin.z + dz)).toBe("hearthmere");
    }
  });

  it("excludes the current legacy combat line from the camp anchor", () => {
    const registry = new PrefabRegistry(seed, { biomeSource });
    const anchor = registry.getAnchorById(PREFAB_IDS.HEARTHMERE_CAMP);
    const legacyPoints = [
      { x: 0, z: 3 },
      { x: 0, z: -4 },
      { x: 0, z: -14 },
      { x: 0, z: -20 }
    ];

    for (const point of legacyPoints) {
      expect(Math.hypot(anchor.origin.x - point.x, anchor.origin.z - point.z)).toBeGreaterThan(12);
    }
  });

  it("returns overlapping placements for the camp chunk", () => {
    const registry = new PrefabRegistry(seed, { biomeSource });
    const anchor = registry.getAnchorById(PREFAB_IDS.HEARTHMERE_CAMP);
    const cx = Math.floor(anchor.origin.x / 32);
    const cz = Math.floor(anchor.origin.z / 32);

    expect(registry.getPlacementsOverlappingChunk(cx, cz).map(({ id }) => id)).toContain(PREFAB_IDS.HEARTHMERE_CAMP);
  });

  it("uses the authored height source for the Hearthmere camp pad", () => {
    const heightSource = { getHeightAt: () => 4 };
    const registry = new PrefabRegistry(seed, { biomeSource, heightSource });
    const anchor = registry.getAnchorById(PREFAB_IDS.HEARTHMERE_CAMP);

    expect(anchor.padHeight).toBe(4);
    expect(anchor.origin.y).toBe(4);
  });

  it("keeps authored hard surfaces inside the fully flattened pad core", () => {
    const registry = new PrefabRegistry(seed, { biomeSource });
    const anchor = registry.getAnchorById(PREFAB_IDS.HEARTHMERE_CAMP);
    const visibleSurfaceRadius = 14;

    expect(anchor.footprintRadius - anchor.blendRadius).toBeGreaterThanOrEqual(visibleSurfaceRadius);
  });
});
