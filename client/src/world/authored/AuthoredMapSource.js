import { RegionRegistry, createDefaultRegionRegistry } from "../regions/RegionRegistry.js";
import { AuthoredPlacementIndex } from "./AuthoredPlacementIndex.js";

export class AuthoredMapSource {
  constructor(options = {}) {
    const registry = options.regionRegistry ?? createDefaultRegionRegistry();

    if (!(registry instanceof RegionRegistry)) {
      throw new TypeError("AuthoredMapSource requires a RegionRegistry instance.");
    }

    this.regionRegistry = registry;
    this.placementIndex = options.placementIndex ?? new AuthoredPlacementIndex(registry.getRegions());

    Object.freeze(this);
  }

  getRegions() {
    return this.regionRegistry.getRegions();
  }

  getRegion(regionId) {
    return this.regionRegistry.getRegion(regionId);
  }

  getSpawnPoint(regionId = null) {
    return this.regionRegistry.getSpawnPoint(regionId);
  }

  findRegionAt(worldX, worldZ) {
    return this.regionRegistry.findRegionAt(worldX, worldZ);
  }

  heightAt(worldX, worldZ) {
    return this.regionRegistry.heightAt(worldX, worldZ);
  }

  terrainHeightAt(worldX, worldZ) {
    const authoredHeight = this.heightAt(worldX, worldZ);
    if (Number.isFinite(authoredHeight)) return authoredHeight;

    return this.regionRegistry.nearestHeightAt(worldX, worldZ);
  }

  getHeightAt(worldX, worldZ) {
    return this.regionRegistry.getHeightAt(worldX, worldZ);
  }

  sampleHeight(worldX, worldZ) {
    return this.regionRegistry.sampleHeight(worldX, worldZ);
  }

  normalizedHeightAt(worldX, worldZ) {
    return this.regionRegistry.normalizedHeightAt(worldX, worldZ);
  }

  terrainNormalizedHeightAt(worldX, worldZ) {
    const normalized = this.normalizedHeightAt(worldX, worldZ);
    if (Number.isFinite(normalized)) return normalized;

    return this.regionRegistry.nearestNormalizedHeightAt(worldX, worldZ);
  }

  terrainBiomeAt(worldX, worldZ) {
    return this.regionRegistry.terrainBiomeAt(worldX, worldZ) ?? null;
  }

  biomeAt(worldX, worldZ) {
    return this.regionRegistry.biomeAt(worldX, worldZ) ?? null;
  }

  getBiomeAt(worldX, worldZ) {
    return this.biomeAt(worldX, worldZ);
  }

  sampleBiome(worldX, worldZ) {
    return this.biomeAt(worldX, worldZ);
  }

  sampleBiomeId(worldX, worldZ) {
    return this.regionRegistry.sampleBiomeId(worldX, worldZ) ?? null;
  }

  sampleBiomeBlend(worldX, worldZ) {
    return this.regionRegistry.sampleBiomeBlend(worldX, worldZ) ?? null;
  }

  getPlacementsForChunk(chunkX, chunkZ) {
    return this.placementIndex.getPlacementsForChunk(chunkX, chunkZ);
  }

  getChunkPlacements(chunkX, chunkZ) {
    return this.getPlacementsForChunk(chunkX, chunkZ);
  }

  getResourcesForChunk(chunkX, chunkZ) {
    return this.placementIndex.getResourcesForChunk(chunkX, chunkZ);
  }

  getEnemiesForChunk(chunkX, chunkZ) {
    return this.placementIndex.getEnemiesForChunk(chunkX, chunkZ);
  }

  getPrefabsForChunk(chunkX, chunkZ) {
    return this.placementIndex.getPrefabsForChunk(chunkX, chunkZ);
  }

  getNpcsForChunk(chunkX, chunkZ) {
    return this.placementIndex.getNpcsForChunk(chunkX, chunkZ);
  }

  getContentForChunk(chunkX, chunkZ) {
    return this.placementIndex.getContentForChunk(chunkX, chunkZ);
  }
}
