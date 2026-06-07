import { HearthmereRegion } from "./hearthmere/HearthmereRegion.js";

const EMPTY_PLACEMENTS = Object.freeze([]);

export class RegionRegistry {
  constructor(regions = [new HearthmereRegion()]) {
    if (!Array.isArray(regions) || !regions.length) {
      throw new TypeError("RegionRegistry requires at least one region.");
    }

    this._regions = Object.freeze(regions.slice());
    this._regionsById = Object.freeze(indexRegionsById(this._regions));

    Object.freeze(this);
  }

  getRegions() {
    return this._regions;
  }

  getAllRegions() {
    return this._regions;
  }

  getRegion(regionId) {
    return this._regionsById[regionId] ?? null;
  }

  getSpawnPoint(regionId = null) {
    if (regionId) {
      const spawn = this.getRegion(regionId)?.spawn ?? null;
      return spawn ? clonePoint(spawn) : null;
    }

    const spawn = this._regions.find((region) => region.spawn)?.spawn ?? null;
    return spawn ? clonePoint(spawn) : null;
  }

  findRegionAt(worldX, worldZ) {
    return this._regions.find((region) => region.contains(worldX, worldZ)) ?? null;
  }

  heightAt(worldX, worldZ) {
    return this.findRegionAt(worldX, worldZ)?.heightAt(worldX, worldZ) ?? null;
  }

  getHeightAt(worldX, worldZ) {
    return this.heightAt(worldX, worldZ);
  }

  sampleHeight(worldX, worldZ) {
    return this.heightAt(worldX, worldZ);
  }

  normalizedHeightAt(worldX, worldZ) {
    return this.findRegionAt(worldX, worldZ)?.normalizedHeightAt(worldX, worldZ) ?? null;
  }

  nearestHeightAt(worldX, worldZ) {
    const sample = this._nearestRegionSample(worldX, worldZ);
    return sample?.region.heightAt(sample.x, sample.z) ?? null;
  }

  nearestNormalizedHeightAt(worldX, worldZ) {
    const sample = this._nearestRegionSample(worldX, worldZ);
    return sample?.region.normalizedHeightAt(sample.x, sample.z) ?? null;
  }

  biomeAt(worldX, worldZ) {
    return this.findRegionAt(worldX, worldZ)?.biomeAt(worldX, worldZ) ?? null;
  }

  terrainBiomeAt(worldX, worldZ) {
    const region = this.findRegionAt(worldX, worldZ);
    if (region) return sampleRegionTerrainBiome(region, worldX, worldZ);

    const sample = this._nearestRegionSample(worldX, worldZ);
    if (!sample) return null;

    return sampleRegionTerrainBiome(sample.region, sample.x, sample.z);
  }

  getBiomeAt(worldX, worldZ) {
    return this.biomeAt(worldX, worldZ);
  }

  sampleBiome(worldX, worldZ) {
    return this.biomeAt(worldX, worldZ);
  }

  sampleBiomeId(worldX, worldZ) {
    return this.findRegionAt(worldX, worldZ)?.sampleBiomeId(worldX, worldZ) ?? null;
  }

  sampleBiomeBlend(worldX, worldZ) {
    return this.findRegionAt(worldX, worldZ)?.sampleBiomeBlend(worldX, worldZ) ?? null;
  }

  getPlacementsForChunk(chunkX, chunkZ) {
    const placements = [];

    for (const region of this._regions) {
      const regionPlacements = region.getPlacementsForChunk(chunkX, chunkZ);
      if (regionPlacements.length) placements.push(...regionPlacements);
    }

    return placements.length ? Object.freeze(placements) : EMPTY_PLACEMENTS;
  }

  getChunkPlacements(chunkX, chunkZ) {
    return this.getPlacementsForChunk(chunkX, chunkZ);
  }

  getContentForChunk(chunkX, chunkZ) {
    const placements = this.getPlacementsForChunk(chunkX, chunkZ);

    if (!placements.length) return null;

    return Object.freeze({
      chunkX,
      chunkZ,
      placements
    });
  }

  _nearestRegionSample(worldX, worldZ) {
    let nearest = null;

    for (const region of this._regions) {
      const x = clamp(worldX, region.bounds.minX, region.bounds.maxX);
      const z = clamp(worldZ, region.bounds.minZ, region.bounds.maxZ);
      const dx = worldX - x;
      const dz = worldZ - z;
      const distanceSq = dx * dx + dz * dz;

      if (!nearest || distanceSq < nearest.distanceSq) {
        nearest = { region, x, z, distanceSq };
      }
    }

    return nearest;
  }
}

export function createDefaultRegionRegistry() {
  return new RegionRegistry([new HearthmereRegion()]);
}

function indexRegionsById(regions) {
  const regionsById = {};

  for (const region of regions) {
    if (regionsById[region.id]) {
      throw new Error(`Duplicate region id "${region.id}" in RegionRegistry.`);
    }

    regionsById[region.id] = region;
  }

  return regionsById;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clonePoint(point) {
  return Object.freeze({
    x: point.x,
    y: point.y,
    z: point.z
  });
}

function sampleRegionTerrainBiome(region, worldX, worldZ) {
  if (region && typeof region.terrainBiomeAt === "function") {
    const biome = region.terrainBiomeAt(worldX, worldZ);
    if (biome) return biome;
  }

  if (region && typeof region.sampleBiomeBlend === "function") {
    const biome = region.sampleBiomeBlend(worldX, worldZ);
    if (biome) return biome;
  }

  if (region && typeof region.getBiomeAt === "function") {
    const biome = region.getBiomeAt(worldX, worldZ);
    if (biome) return biome;
  }

  if (region && typeof region.biomeAt === "function") {
    return region.biomeAt(worldX, worldZ) ?? null;
  }

  return null;
}
