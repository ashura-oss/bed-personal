import { fbm } from "./Rng.js";
import {
  TERRAIN_AMPLITUDE,
  TERRAIN_BASE_FREQ,
  TERRAIN_BASE_HEIGHT,
  TERRAIN_DETAIL_FREQ,
  TERRAIN_DETAIL_WEIGHT
} from "./WorldConfig.js";

/**
 * heightField — the pure terrain height function.
 *
 * Extracted from TerrainGenerator so it has zero Three.js / DOM dependency
 * and can be unit-tested directly (including seam behaviour). This is the
 * single world-space source of truth for terrain elevation.
 */

/**
 * World-space terrain height at any point. Sampled in WORLD coordinates so
 * two chunks sharing an edge compute identical heights at the shared vertices.
 */
export function terrainHeightAt(worldX, worldZ, seed) {
  const base = fbm(worldX * TERRAIN_BASE_FREQ, worldZ * TERRAIN_BASE_FREQ, seed, {
    octaves: 4
  });
  const detail = fbm(worldX * TERRAIN_DETAIL_FREQ, worldZ * TERRAIN_DETAIL_FREQ, seed + 7919, {
    octaves: 2
  });
  const combined = base + detail * TERRAIN_DETAIL_WEIGHT;
  const normalised = combined / (1 + TERRAIN_DETAIL_WEIGHT); // back to ~[0,1]
  return (normalised - 0.5) * 2 * TERRAIN_AMPLITUDE + TERRAIN_BASE_HEIGHT;
}
