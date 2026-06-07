import { AUTHORED_WORLD_HALF_SIZE, AUTHORED_WORLD_SIZE, CHUNK_SIZE } from "../gen/WorldConfig.js";

export const AUTHORED_WORLD_WIDTH = AUTHORED_WORLD_SIZE;
export const AUTHORED_WORLD_DEPTH = AUTHORED_WORLD_SIZE;
export const AUTHORED_WORLD_HALF_WIDTH = AUTHORED_WORLD_WIDTH / 2;
export const AUTHORED_WORLD_HALF_DEPTH = AUTHORED_WORLD_HALF_SIZE;
export const AUTHORED_WORLD_BOUNDS = Object.freeze({
  minX: -AUTHORED_WORLD_HALF_WIDTH,
  maxX: AUTHORED_WORLD_HALF_WIDTH,
  minZ: -AUTHORED_WORLD_HALF_DEPTH,
  maxZ: AUTHORED_WORLD_HALF_DEPTH
});

const EMPTY_PLACEMENTS = Object.freeze([]);

export function worldToChunkCoord(worldValue) {
  return Math.floor(worldValue / CHUNK_SIZE);
}

export function getChunkKey(chunkX, chunkZ) {
  return `${chunkX},${chunkZ}`;
}

export class RegionBase {
  constructor(definition) {
    if (!definition || typeof definition !== "object") {
      throw new TypeError("RegionBase requires a definition object.");
    }

    const {
      id,
      name = id,
      bounds,
      biome,
      biomeMask = null,
      spawn = null,
      terrain = {},
      placements = EMPTY_PLACEMENTS
    } = definition;

    if (!id) {
      throw new TypeError("RegionBase requires a stable id.");
    }

    if (!biome || typeof biome !== "object") {
      throw new TypeError(`Region "${id}" requires a biome definition.`);
    }

    this.id = String(id);
    this.name = String(name ?? id);
    this.bounds = freezeBounds(bounds, this.id);
    this.biome = Object.freeze({ ...biome });
    this.biomeMask = biomeMask;
    this.spawn = freezeSpawn(spawn, terrain, this.bounds);
    this.terrain = Object.freeze({
      height: Number.isFinite(terrain.height) ? Number(terrain.height) : 0,
      heightSource: terrain.heightSource ?? terrain.heightmap ?? null
    });
    this.placements = freezePlacements(placements, this.id, terrain, this.bounds);
    this._placementsByChunk = Object.freeze(indexPlacementsByChunk(this.placements));

    Object.freeze(this);
  }

  contains(worldX, worldZ) {
    return (
      worldX >= this.bounds.minX &&
      worldX <= this.bounds.maxX &&
      worldZ >= this.bounds.minZ &&
      worldZ <= this.bounds.maxZ
    );
  }

  heightAt(worldX, worldZ) {
    if (!this.contains(worldX, worldZ)) return null;
    return sampleTerrainHeightAt(this.terrain, worldX, worldZ);
  }

  getHeightAt(worldX, worldZ) {
    return this.heightAt(worldX, worldZ);
  }

  sampleHeight(worldX, worldZ) {
    return this.heightAt(worldX, worldZ);
  }

  normalizedHeightAt(worldX, worldZ) {
    if (!this.contains(worldX, worldZ)) return null;

    const source = this.terrain.heightSource;

    if (source && typeof source.normalizedHeightAt === "function") {
      const normalized = source.normalizedHeightAt(worldX, worldZ);
      return Number.isFinite(normalized) ? normalized : 0.5;
    }

    return 0.5;
  }

  biomeAt(worldX, worldZ) {
    if (!this.contains(worldX, worldZ)) return null;
    return this.biome;
  }

  getBiomeAt(worldX, worldZ) {
    return this.biomeAt(worldX, worldZ);
  }

  sampleBiome(worldX, worldZ) {
    return this.biomeAt(worldX, worldZ);
  }

  sampleBiomeId(worldX, worldZ) {
    return this.contains(worldX, worldZ) ? this.biome.id : null;
  }

  sampleBiomeBlend(worldX, worldZ) {
    return this.biomeAt(worldX, worldZ);
  }

  getPlacementsForChunk(chunkX, chunkZ) {
    return this._placementsByChunk[getChunkKey(chunkX, chunkZ)] ?? EMPTY_PLACEMENTS;
  }

  getChunkPlacements(chunkX, chunkZ) {
    return this.getPlacementsForChunk(chunkX, chunkZ);
  }

  getContentForChunk(chunkX, chunkZ) {
    const placements = this.getPlacementsForChunk(chunkX, chunkZ);

    if (!placements.length) return null;

    return Object.freeze({
      regionId: this.id,
      chunkX,
      chunkZ,
      placements
    });
  }
}

function freezeBounds(bounds, regionId) {
  if (!bounds || typeof bounds !== "object") {
    throw new TypeError(`Region "${regionId}" requires bounds.`);
  }

  const minX = Number(bounds.minX);
  const maxX = Number(bounds.maxX);
  const minZ = Number(bounds.minZ);
  const maxZ = Number(bounds.maxZ);

  if (![minX, maxX, minZ, maxZ].every(Number.isFinite)) {
    throw new TypeError(`Region "${regionId}" bounds must be finite numbers.`);
  }

  if (minX > maxX || minZ > maxZ) {
    throw new RangeError(`Region "${regionId}" bounds are inverted.`);
  }

  if (
    minX < AUTHORED_WORLD_BOUNDS.minX ||
    maxX > AUTHORED_WORLD_BOUNDS.maxX ||
    minZ < AUTHORED_WORLD_BOUNDS.minZ ||
    maxZ > AUTHORED_WORLD_BOUNDS.maxZ
  ) {
    throw new RangeError(`Region "${regionId}" bounds must stay inside the authored world.`);
  }

  return Object.freeze({ minX, maxX, minZ, maxZ });
}

function freezeSpawn(spawn, terrain, bounds) {
  if (!spawn) return null;

  const x = Number(spawn.x);
  const z = Number(spawn.z);
  const y = Number.isFinite(spawn.y) ? Number(spawn.y) : sampleTerrainHeightAt(terrain, x, z);

  if (![x, y, z].every(Number.isFinite)) {
    throw new TypeError("Region spawn must contain finite coordinates.");
  }

  if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) {
    throw new RangeError("Region spawn must stay inside region bounds.");
  }

  return Object.freeze({ x, y, z });
}

function freezePlacements(placements, regionId, terrain, bounds) {
  if (!Array.isArray(placements)) {
    throw new TypeError(`Region "${regionId}" placements must be an array.`);
  }

  return Object.freeze(
    placements.map((placement, index) => freezePlacement(placement, regionId, index, terrain, bounds))
  );
}

function freezePlacement(placement, regionId, index, terrain, bounds) {
  if (!placement || typeof placement !== "object") {
    throw new TypeError(`Region "${regionId}" placement ${index} must be an object.`);
  }

  const origin = placement.origin ?? placement.position ?? placement;
  const x = Number(origin.x);
  const z = Number(origin.z);
  const y = Number.isFinite(origin.y)
    ? Number(origin.y)
    : sampleTerrainHeightAt(terrain, x, z);

  if (![x, y, z].every(Number.isFinite)) {
    throw new TypeError(`Region "${regionId}" placement ${index} requires finite coordinates.`);
  }

  if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) {
    throw new RangeError(`Region "${regionId}" placement ${index} must stay inside region bounds.`);
  }

  const chunkX = worldToChunkCoord(x);
  const chunkZ = worldToChunkCoord(z);

  return Object.freeze({
    ...placement,
    regionId,
    origin: Object.freeze({ x, y, z }),
    chunkX,
    chunkZ
  });
}

function sampleTerrainHeightAt(terrain, worldX, worldZ) {
  const source = terrain.heightSource ?? terrain.heightmap ?? null;

  if (typeof source === "function") {
    const height = source(worldX, worldZ);
    if (Number.isFinite(height)) return height;
  }

  if (source && typeof source.getHeightAt === "function") {
    const height = source.getHeightAt(worldX, worldZ);
    if (Number.isFinite(height)) return height;
  }

  if (source && typeof source.heightAt === "function") {
    const height = source.heightAt(worldX, worldZ);
    if (Number.isFinite(height)) return height;
  }

  if (source && typeof source.sampleHeight === "function") {
    const height = source.sampleHeight(worldX, worldZ);
    if (Number.isFinite(height)) return height;
  }

  return Number.isFinite(terrain.height) ? Number(terrain.height) : 0;
}

function indexPlacementsByChunk(placements) {
  const placementsByChunk = {};

  for (const placement of placements) {
    const key = getChunkKey(placement.chunkX, placement.chunkZ);
    const bucket = placementsByChunk[key] ?? [];
    bucket.push(placement);
    placementsByChunk[key] = bucket;
  }

  for (const key of Object.keys(placementsByChunk)) {
    placementsByChunk[key] = Object.freeze(placementsByChunk[key].slice());
  }

  return placementsByChunk;
}
