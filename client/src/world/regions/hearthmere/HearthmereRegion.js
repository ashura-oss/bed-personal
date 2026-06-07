import { STARTER_BIOME_ID, getBiomeDefinition } from "../../biomes/BiomeDefinitions.js";
import { HEARTHMERE_REGION_BOUNDS as HEARTHMERE_REGION_CONFIG_BOUNDS } from "../../gen/WorldConfig.js";
import { RegionBase } from "../_RegionBase.js";
import { createHearthmereHeightmap } from "./heightmap.js";
import { HEARTHMERE_PLACEMENTS } from "./placements.js";
import { createHearthmereBiomeMask, getZoneAt } from "./zones.js";

export const HEARTHMERE_REGION_ID = "hearthmere";
export const HEARTHMERE_REGION_BOUNDS = HEARTHMERE_REGION_CONFIG_BOUNDS;
export const HEARTHMERE_SPAWN_POINT = Object.freeze({
  x: 0,
  y: 0,
  z: 3
});
export const HEARTHMERE_FLAT_TERRAIN_HEIGHT = 0;

export class HearthmereRegion extends RegionBase {
  constructor(options = {}) {
    const heightSource = options.heightSource ?? options.heightmap ?? createHearthmereHeightmap();
    const biomeMask = options.biomeMask === undefined ? createHearthmereBiomeMask() : options.biomeMask;

    super({
      id: HEARTHMERE_REGION_ID,
      name: "Hearthmere",
      biome: options.biome ?? getBiomeDefinition(STARTER_BIOME_ID),
      biomeMask,
      bounds: options.bounds ?? HEARTHMERE_REGION_BOUNDS,
      spawn: options.spawn ?? HEARTHMERE_SPAWN_POINT,
      terrain: {
        height: options.terrainHeight ?? HEARTHMERE_FLAT_TERRAIN_HEIGHT,
        heightSource
      },
      placements: options.placements ?? HEARTHMERE_PLACEMENTS
    });
  }

  biomeAt(worldX, worldZ) {
    if (!this.contains(worldX, worldZ)) return null;

    const zone = getZoneAt(worldX, worldZ);
    return zone ? overlayZoneBiome(this.biome, zone) : this.biome;
  }

  /**
   * Terrain rendering prefers the richer mask-blended result where present.
   * Runtime biome lookup continues to use rectangle zones via biomeAt().
   *
   * @param {number} worldX
   * @param {number} worldZ
   * @returns {object|null}
   */
  sampleBiomeBlend(worldX, worldZ) {
    if (!this.contains(worldX, worldZ)) return null;

    const maskedBiome = this.biomeMask?.biomeAt?.(this.biome, worldX, worldZ) ?? null;
    if (maskedBiome) return maskedBiome;

    const zone = getZoneAt(worldX, worldZ);
    return zone ? overlayZoneBiome(this.biome, zone) : this.biome;
  }
}

function overlayZoneBiome(baseBiome, zone) {
  return Object.freeze({
    ...baseBiome,
    fogDensity: zone.fogDensity,
    fogColor: zone.fogColor,
    groundColor: zone.groundColor,
    _zoneId: zone.id
  });
}
