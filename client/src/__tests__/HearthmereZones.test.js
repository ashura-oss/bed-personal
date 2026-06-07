import { describe, expect, it } from "@jest/globals";
import {
  HEARTHMERE_ZONES,
  createHearthmereBiomeMask,
  getZoneAt
} from "../world/regions/hearthmere/zones.js";
import { HearthmereRegion } from "../world/regions/hearthmere/HearthmereRegion.js";

// Required BiomeDef fields that every blended biome must carry.
const REQUIRED_BIOME_FIELDS = [
  "id",
  "name",
  "groundColor",
  "accentColor",
  "backgroundColor",
  "fogColor",
  "fogDensity",
  "terrainAmplitude",
  "terrainBaseHeight",
  "roughness",
  "metalness",
  "musicId",
  "resourceTableId",
  "enemyTableId"
];
const ZONE_OVERRIDE_FIELDS = ["fogDensity", "fogColor", "groundColor"];

describe("HearthmereZones — getZoneAt", () => {
  it("returns the plains zone (or null falling back) for the world origin (0, 0)", () => {
    const zone = getZoneAt(0, 0);
    // origin is inside plains bounds { minX:-800, maxX:800, minZ:-800, maxZ:800 }
    expect(zone).not.toBeNull();
    expect(zone.id).toBe("hearthmere.plains");
  });

  it("returns the ember_ridge zone for (-1500, -1000)", () => {
    const zone = getZoneAt(-1500, -1000);
    expect(zone).not.toBeNull();
    expect(zone.id).toBe("hearthmere.ember_ridge");
  });

  it("returns the ashfall_road zone for (200, 1500)", () => {
    const zone = getZoneAt(200, 1500);
    expect(zone).not.toBeNull();
    expect(zone.id).toBe("hearthmere.ashfall_road");
  });

  it("returns the copperstone zone for (1500, 0)", () => {
    // bounds: { minX:900, maxX:2500, minZ:-800, maxZ:800 }
    const zone = getZoneAt(1500, 0);
    expect(zone).not.toBeNull();
    expect(zone.id).toBe("hearthmere.copperstone");
  });

  it("returns the fen zone for (1000, 1500)", () => {
    const zone = getZoneAt(1000, 1500);
    expect(zone).not.toBeNull();
    expect(zone.id).toBe("hearthmere.fen");
  });

  it("returns the hollow_reach zone for (-1000, 1200)", () => {
    // hollow_reach: { minX:-2000, maxX:-300, minZ:0, maxZ:1800 }
    // Z=1200 is above crypt_approach maxZ=800, so hollow_reach wins unambiguously
    const zone = getZoneAt(-1000, 1200);
    expect(zone).not.toBeNull();
    expect(zone.id).toBe("hearthmere.hollow_reach");
  });

  it("returns the crypt_approach zone for (-1500, 300)", () => {
    // bounds: { minX:-2500, maxX:-800, minZ:-200, maxZ:800 }
    const zone = getZoneAt(-1500, 300);
    expect(zone).not.toBeNull();
    expect(zone.id).toBe("hearthmere.crypt_approach");
  });

  it("returns null for a position outside all zone bounds", () => {
    // E.g. far north-east corner, outside all zones
    const zone = getZoneAt(2400, -1800);
    expect(zone).toBeNull();
  });

  it("exposes all seven zones in HEARTHMERE_ZONES", () => {
    expect(HEARTHMERE_ZONES).toHaveLength(7);
    const ids = HEARTHMERE_ZONES.map((z) => z.id);
    expect(ids).toContain("hearthmere.plains");
    expect(ids).toContain("hearthmere.ashfall_road");
    expect(ids).toContain("hearthmere.ember_ridge");
    expect(ids).toContain("hearthmere.copperstone");
    expect(ids).toContain("hearthmere.fen");
    expect(ids).toContain("hearthmere.hollow_reach");
    expect(ids).toContain("hearthmere.crypt_approach");
  });
});

describe("HearthmereZones — HearthmereRegion zone-blended biome", () => {
  const region = new HearthmereRegion();

  it("zone-blended biome at ember_ridge has lower fogDensity than plains", () => {
    // Plains fogDensity = 0.028; Ember Ridge fogDensity = 0.018
    const plainsBiome = region.biomeAt(0, 0);
    const ridgeBiome = region.biomeAt(-1500, -1000);

    expect(ridgeBiome).not.toBeNull();
    expect(plainsBiome).not.toBeNull();
    expect(ridgeBiome.fogDensity).toBeLessThan(plainsBiome.fogDensity);
  });

  it("zone-blended biome always carries all required BiomeDef fields", () => {
    const samplePoints = [
      [0, 0],          // plains
      [-1500, -1000],  // ember_ridge
      [200, 1500],     // ashfall_road
      [1500, 0],       // copperstone
      [1000, 1500],    // fen
      [-1000, 1200],   // hollow_reach (Z>800 avoids crypt_approach overlap)
      [-1500, 300],    // crypt_approach
      [2400, -1800]    // outside all zones — returns base biome
    ];

    for (const [x, z] of samplePoints) {
      const biome = region.biomeAt(x, z);
      expect(biome).not.toBeNull();
      for (const field of REQUIRED_BIOME_FIELDS) {
        expect(biome).toHaveProperty(field);
      }
      expect(typeof biome.id).toBe("string");
      expect(typeof biome.groundColor).toBe("string");
      expect(typeof biome.fogColor).toBe("string");
      expect(typeof biome.fogDensity).toBe("number");
    }
  });

  it("preserves every non-overlay BiomeDef field when a zone override applies", () => {
    const baseBiome = region.biome;
    const biome = region.biomeAt(-1500, -1000);

    expect(biome).not.toBeNull();
    expect(biome).not.toBe(baseBiome);

    for (const field of REQUIRED_BIOME_FIELDS) {
      if (ZONE_OVERRIDE_FIELDS.includes(field)) continue;
      if (["accentColor", "backgroundColor", "terrainAmplitude", "terrainBaseHeight", "roughness", "metalness"].includes(field)) continue;
      expect(biome[field]).toEqual(baseBiome[field]);
    }

    expect(biome.fogDensity).toBeCloseTo(0.018);
    expect(biome.fogColor).toBe("#0d0b12");
    expect(biome.groundColor).toBe("#3d3844");
  });

  it("biome.id remains 'hearthmere' regardless of zone", () => {
    // Zone overrides never change the biome identity
    expect(region.biomeAt(0, 0).id).toBe("hearthmere");
    expect(region.biomeAt(-1500, -1000).id).toBe("hearthmere");
    expect(region.biomeAt(200, 1500).id).toBe("hearthmere");
  });

  it("keeps rectangle zones authoritative for runtime while sampleBiomeBlend retains mask detail", () => {
    const runtimeBiome = region.biomeAt(625, 1500);
    const blendedBiome = region.sampleBiomeBlend(625, 1500);

    expect(runtimeBiome._zoneId).toBe("hearthmere.fen");
    expect(runtimeBiome.fogDensity).toBeCloseTo(0.055);
    expect(blendedBiome._maskWeights["hearthmere.ashfall_road"]).toBeGreaterThan(0);
    expect(blendedBiome._maskWeights["hearthmere.fen"]).toBeGreaterThan(0);
    expect(blendedBiome.fogDensity).toBeGreaterThan(0.045);
    expect(blendedBiome.fogDensity).toBeLessThan(0.055);
  });

  it("returns null outside Hearthmere region bounds", () => {
    expect(region.biomeAt(3000, 0)).toBeNull();
    expect(region.sampleBiomeBlend(0, -3000)).toBeNull();
  });

  it("returns the exact base biome object outside authored sub-biome coverage", () => {
    // (2400, -1800) is inside Hearthmere but outside all current zone coverage.
    const baseBiome = region.biome;

    expect(region.biomeAt(2400, -1800)).toBe(baseBiome);
    expect(region.sampleBiomeBlend(2400, -1800)).toBe(baseBiome);
  });

  it("returns the exact base biome outside rectangle zones even when the mask has a dominant sub-biome", () => {
    const baseBiome = region.biome;
    const blendedBiome = region.sampleBiomeBlend(-2500, 1500);

    expect(getZoneAt(-2500, 1500)).toBeNull();
    expect(region.biomeAt(-2500, 1500)).toBe(baseBiome);
    expect(blendedBiome).not.toBe(baseBiome);
    expect(blendedBiome._zoneId).toBe("hearthmere.hollow_reach");
    expect(blendedBiome._maskWeights["hearthmere.hollow_reach"]).toBeGreaterThan(0);
  });
});

describe("HearthmereZones — authored biome mask", () => {
  const mask = createHearthmereBiomeMask();

  it("decodes dominant sub-biomes at Hearthmere landmark samples", () => {
    expect(mask.sampleDominantId(0, 0)).toBe("hearthmere.plains");
    expect(mask.sampleDominantId(-1500, -1000)).toBe("hearthmere.ember_ridge");
    expect(mask.sampleDominantId(200, 1500)).toBe("hearthmere.ashfall_road");
    expect(mask.sampleDominantId(1500, 0)).toBe("hearthmere.copperstone");
    expect(mask.sampleDominantId(1000, 1500)).toBe("hearthmere.fen");
    expect(mask.sampleDominantId(-1000, 1200)).toBe("hearthmere.hollow_reach");
    expect(mask.sampleDominantId(-1500, 300)).toBe("hearthmere.crypt_approach");
  });

  it("blends neighboring mask regions instead of hard switching", () => {
    const region = new HearthmereRegion();
    const weights = mask.sampleWeights(625, 1500);
    const runtimeBiome = region.biomeAt(625, 1500);
    const biome = region.sampleBiomeBlend(625, 1500);

    expect(weights["hearthmere.ashfall_road"]).toBeGreaterThan(0);
    expect(weights["hearthmere.fen"]).toBeGreaterThan(0);
    expect(runtimeBiome._zoneId).toBe("hearthmere.fen");
    expect(runtimeBiome.fogDensity).toBeCloseTo(0.055);
    expect(biome._maskWeights["hearthmere.ashfall_road"]).toBeGreaterThan(0);
    expect(biome._maskWeights["hearthmere.fen"]).toBeGreaterThan(0);
    expect(biome.fogDensity).toBeGreaterThan(0.045);
    expect(biome.fogDensity).toBeLessThan(0.055);
  });
});
