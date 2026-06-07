import { loadAuthoredBiomeMask } from "../../authored/AuthoredBiomeMask.js";
import { HEARTHMERE_REGION_BOUNDS } from "../../gen/WorldConfig.js";

/**
 * Hearthmere sub-zone definitions.
 *
 * Zones are atmosphere-overlay rectangles within the Hearthmere region.
 * They are NOT separate biomes — they tint the base Hearthmere biome
 * with per-area fog, ground colour, and density overrides.
 *
 * No Three.js / Rapier imports. Pure data + query logic.
 */

export const HEARTHMERE_ZONES = Object.freeze([
  Object.freeze({
    id: "hearthmere.plains",
    label: "Hearthmere Plains",
    bounds: Object.freeze({ minX: -800, maxX: 800, minZ: -800, maxZ: 800 }),
    fogDensity: 0.028,
    fogColor: "#141009",
    groundColor: "#4f4733"
  }),
  Object.freeze({
    id: "hearthmere.ashfall_road",
    label: "Ashfall Road",
    bounds: Object.freeze({ minX: -300, maxX: 300, minZ: 800, maxZ: 2000 }),
    fogDensity: 0.045,
    fogColor: "#1a1008",
    groundColor: "#5a4b38"
  }),
  Object.freeze({
    id: "hearthmere.ember_ridge",
    label: "Ember Ridge",
    bounds: Object.freeze({ minX: -2500, maxX: -900, minZ: -2000, maxZ: -200 }),
    fogDensity: 0.018,
    fogColor: "#0d0b12",
    groundColor: "#3d3844"
  }),
  Object.freeze({
    id: "hearthmere.copperstone",
    label: "Copperstone Mine",
    bounds: Object.freeze({ minX: 900, maxX: 2500, minZ: -800, maxZ: 800 }),
    fogDensity: 0.032,
    fogColor: "#120e08",
    groundColor: "#6b5540"
  }),
  Object.freeze({
    id: "hearthmere.fen",
    label: "Greymere Fen",
    bounds: Object.freeze({ minX: 300, maxX: 2200, minZ: 600, maxZ: 2000 }),
    fogDensity: 0.055,
    fogColor: "#0a1010",
    groundColor: "#3b4a38"
  }),
  // crypt_approach is ordered before hollow_reach: the crypt bounds occupy the
  // tighter Z band [-200, +800] while hollow_reach extends to +1800. Where they
  // overlap (minX -2000 to -800, Z 0 to 800), the crypt atmosphere wins.
  Object.freeze({
    id: "hearthmere.crypt_approach",
    label: "Hearthmere Crypt",
    bounds: Object.freeze({ minX: -2500, maxX: -800, minZ: -200, maxZ: 800 }),
    fogDensity: 0.042,
    fogColor: "#0c0c14",
    groundColor: "#3a3850"
  }),
  Object.freeze({
    id: "hearthmere.hollow_reach",
    label: "Hollow's Reach",
    bounds: Object.freeze({ minX: -2000, maxX: -300, minZ: 0, maxZ: 1800 }),
    fogDensity: 0.038,
    fogColor: "#100c0c",
    groundColor: "#524038"
  })
]);

export const HEARTHMERE_SUB_BIOMES = Object.freeze(Object.fromEntries(
  HEARTHMERE_ZONES.map((zone) => [zone.id, Object.freeze({
    id: zone.id,
    label: zone.label,
    fogDensity: zone.fogDensity,
    fogColor: zone.fogColor,
    groundColor: zone.groundColor
  })])
));

export const HEARTHMERE_BIOME_MASK_SAMPLES = Object.freeze([
  Object.freeze(["hearthmere.ember_ridge", "hearthmere.ember_ridge", null, null, null]),
  Object.freeze(["hearthmere.ember_ridge", "hearthmere.ember_ridge", null, null, null]),
  Object.freeze(["hearthmere.crypt_approach", "hearthmere.crypt_approach", "hearthmere.plains", "hearthmere.copperstone", "hearthmere.copperstone"]),
  Object.freeze(["hearthmere.hollow_reach", "hearthmere.hollow_reach", "hearthmere.ashfall_road", "hearthmere.fen", "hearthmere.fen"]),
  Object.freeze([null, "hearthmere.hollow_reach", "hearthmere.ashfall_road", "hearthmere.fen", "hearthmere.fen"])
]);

export const HEARTHMERE_BIOME_MASK_DEFINITION = Object.freeze({
  id: "hearthmere.biome_mask.v1",
  bounds: HEARTHMERE_REGION_BOUNDS,
  samples: HEARTHMERE_BIOME_MASK_SAMPLES,
  subBiomes: HEARTHMERE_SUB_BIOMES
});

export function createHearthmereBiomeMask(options = {}) {
  return loadAuthoredBiomeMask({
    ...HEARTHMERE_BIOME_MASK_DEFINITION,
    ...options,
    subBiomes: {
      ...HEARTHMERE_BIOME_MASK_DEFINITION.subBiomes,
      ...(options.subBiomes ?? {})
    }
  });
}

/**
 * Returns the first zone whose bounds contain (worldX, worldZ), or null
 * if no zone claims the position.
 *
 * Callers may fall back to the base Hearthmere biome when null is returned.
 *
 * @param {number} worldX
 * @param {number} worldZ
 * @returns {object|null}
 */
export function getZoneAt(worldX, worldZ) {
  for (const zone of HEARTHMERE_ZONES) {
    const { minX, maxX, minZ, maxZ } = zone.bounds;
    if (worldX >= minX && worldX <= maxX && worldZ >= minZ && worldZ <= maxZ) {
      return zone;
    }
  }
  return null;
}
