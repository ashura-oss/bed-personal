import { CHUNK_SIZE } from "../gen/WorldConfig.js";

const EMPTY_PLACEMENTS = Object.freeze([]);

/**
 * @typedef {object} AuthoredPlacementContent
 * @property {number} chunkX
 * @property {number} chunkZ
 * @property {ReadonlyArray<object>} placements
 * @property {ReadonlyArray<object>} resources
 * @property {ReadonlyArray<object>} enemies
 * @property {ReadonlyArray<object>} prefabs
 * @property {ReadonlyArray<object>} npcs
 */

export function worldToChunkCoord(worldValue) {
  const numeric = Number(worldValue);

  if (!Number.isFinite(numeric)) {
    throw new TypeError("worldToChunkCoord requires a finite world coordinate.");
  }

  return Math.floor(numeric / CHUNK_SIZE);
}

export function getChunkKey(chunkX, chunkZ) {
  return `${Number(chunkX)},${Number(chunkZ)}`;
}

export class AuthoredPlacementIndex {
  constructor(entries = EMPTY_PLACEMENTS) {
    if (!Array.isArray(entries)) {
      throw new TypeError("AuthoredPlacementIndex requires an array of placements or regions.");
    }

    const placements = Object.freeze(collectPlacements(entries));
    const { contentByChunk, typesByChunk } = buildChunkIndex(placements);

    this.placements = placements;
    this._contentByChunk = Object.freeze(contentByChunk);
    this._typesByChunk = Object.freeze(typesByChunk);

    Object.freeze(this);
  }

  getPlacementsForChunk(chunkX, chunkZ, options = {}) {
    const key = getChunkKey(chunkX, chunkZ);
    const content = this._contentByChunk[key];
    if (!content) return EMPTY_PLACEMENTS;

    const type = options?.type;
    if (typeof type !== "string" || !type) {
      return content.placements;
    }

    return this._typesByChunk[key]?.[type] ?? EMPTY_PLACEMENTS;
  }

  getResourcesForChunk(chunkX, chunkZ) {
    return this.getPlacementsForChunk(chunkX, chunkZ, { type: "resource" });
  }

  getEnemiesForChunk(chunkX, chunkZ) {
    return this.getPlacementsForChunk(chunkX, chunkZ, { type: "enemy" });
  }

  getPrefabsForChunk(chunkX, chunkZ) {
    return this.getPlacementsForChunk(chunkX, chunkZ, { type: "prefab" });
  }

  getNpcsForChunk(chunkX, chunkZ) {
    return this.getPlacementsForChunk(chunkX, chunkZ, { type: "npc" });
  }

  /**
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {AuthoredPlacementContent|null}
   */
  getContentForChunk(chunkX, chunkZ) {
    return this._contentByChunk[getChunkKey(chunkX, chunkZ)] ?? null;
  }
}

export function createAuthoredPlacementIndex(entries) {
  return new AuthoredPlacementIndex(entries);
}

function collectPlacements(entries) {
  const placements = [];

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
    const entry = entries[entryIndex];

    if (isRegionLike(entry)) {
      for (let placementIndex = 0; placementIndex < entry.placements.length; placementIndex += 1) {
        placements.push(normalizePlacement(entry.placements[placementIndex], entry, placementIndex));
      }
      continue;
    }

    placements.push(normalizePlacement(entry, null, entryIndex));
  }

  return placements;
}

function isRegionLike(value) {
  return Boolean(value)
    && typeof value === "object"
    && Array.isArray(value.placements)
    && !hasPlacementCoordinates(value);
}

function hasPlacementCoordinates(value) {
  if (!value || typeof value !== "object") return false;

  const origin = value.origin ?? value.position ?? value;
  const x = Number(origin?.x);
  const z = Number(origin?.z);

  return Number.isFinite(x) && Number.isFinite(z);
}

function normalizePlacement(placement, region, index) {
  if (!placement || typeof placement !== "object") {
    throw new TypeError(buildPlacementError(region, index, "must be an object."));
  }

  const sourceOrigin = placement.origin ?? placement.position ?? placement;
  const x = Number(sourceOrigin.x);
  const z = Number(sourceOrigin.z);

  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    throw new TypeError(buildPlacementError(region, index, "requires finite origin.x and origin.z."));
  }

  const yValue = Number(sourceOrigin.y);
  const normalized = {
    ...placement,
    origin: {
      ...toPlainObject(sourceOrigin),
      x,
      y: Number.isFinite(yValue) ? yValue : 0,
      z
    },
    chunkX: worldToChunkCoord(x),
    chunkZ: worldToChunkCoord(z)
  };

  if (region && normalized.regionId == null && region.id != null) {
    normalized.regionId = region.id;
  }

  if (region && normalized.biomeId == null && region.biome?.id != null) {
    normalized.biomeId = region.biome.id;
  }

  return cloneAndFreeze(normalized);
}

function buildPlacementError(region, index, message) {
  const owner = region?.id ? `Region "${region.id}"` : "Authored placement input";
  return `${owner} placement ${index} ${message}`;
}

function buildChunkIndex(placements) {
  const placementsByChunk = {};
  const typesByChunk = {};

  for (const placement of placements) {
    const key = getChunkKey(placement.chunkX, placement.chunkZ);
    const placementBucket = placementsByChunk[key] ?? [];
    placementBucket.push(placement);
    placementsByChunk[key] = placementBucket;

    if (typeof placement.type === "string" && placement.type) {
      const chunkTypes = typesByChunk[key] ?? {};
      const typedBucket = chunkTypes[placement.type] ?? [];
      typedBucket.push(placement);
      chunkTypes[placement.type] = typedBucket;
      typesByChunk[key] = chunkTypes;
    }
  }

  const contentByChunk = {};
  const frozenTypesByChunk = {};

  for (const key of Object.keys(placementsByChunk)) {
    const frozenPlacements = Object.freeze(placementsByChunk[key].slice());
    const frozenTypes = freezeTypeBuckets(typesByChunk[key] ?? {});
    const [chunkX, chunkZ] = key.split(",").map(Number);

    contentByChunk[key] = Object.freeze({
      chunkX,
      chunkZ,
      placements: frozenPlacements,
      resources: frozenTypes.resource ?? EMPTY_PLACEMENTS,
      enemies: frozenTypes.enemy ?? EMPTY_PLACEMENTS,
      prefabs: frozenTypes.prefab ?? EMPTY_PLACEMENTS,
      npcs: frozenTypes.npc ?? EMPTY_PLACEMENTS
    });
    frozenTypesByChunk[key] = frozenTypes;
  }

  return { contentByChunk, typesByChunk: frozenTypesByChunk };
}

function freezeTypeBuckets(typeBuckets) {
  const frozen = {};

  for (const type of Object.keys(typeBuckets)) {
    frozen[type] = Object.freeze(typeBuckets[type].slice());
  }

  return Object.freeze(frozen);
}

function cloneAndFreeze(value, seen = new WeakMap()) {
  if (Array.isArray(value)) {
    if (seen.has(value)) return seen.get(value);

    const cloned = [];
    seen.set(value, cloned);

    for (const entry of value) {
      cloned.push(cloneAndFreeze(entry, seen));
    }

    return Object.freeze(cloned);
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) return seen.get(value);

    const cloned = {};
    seen.set(value, cloned);

    for (const [key, entry] of Object.entries(value)) {
      cloned[key] = cloneAndFreeze(entry, seen);
    }

    return Object.freeze(cloned);
  }

  return value;
}

function toPlainObject(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return value;
}
