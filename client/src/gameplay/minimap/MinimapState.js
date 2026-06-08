import { CHUNK_SIZE } from "../../world/gen/WorldConfig.js";

export const MINIMAP_SNAPSHOT_VERSION = 1;
export const DEFAULT_MINIMAP_VIEW_RADIUS = 3;

const EMPTY_MINIMAP_STATE = Object.freeze({
  exploredChunkKeys: Object.freeze([]),
  currentBiome: null,
  hearthlights: Object.freeze([])
});

export function createMinimapState(snapshot = null) {
  if (snapshot) return restoreMinimapSnapshot(snapshot);
  return EMPTY_MINIMAP_STATE;
}

export function updateMinimapFromPlayer(state, options = {}) {
  const position = normalizePosition(
    options.playerPosition ?? options.worldPosition ?? options.position
  );
  if (!position) return normalizeMinimapState(state);

  const chunkSize = normalizePositiveNumber(options.chunkSize, CHUNK_SIZE);
  const chunkRadius = Math.floor(normalizeNonNegativeNumber(options.exploreRadius, 0));
  const centerChunk = worldToChunkPosition(position, chunkSize);
  const explored = new Set(normalizeMinimapState(state).exploredChunkKeys);

  for (let dz = -chunkRadius; dz <= chunkRadius; dz += 1) {
    for (let dx = -chunkRadius; dx <= chunkRadius; dx += 1) {
      explored.add(createMinimapChunkKey(centerChunk.chunkX + dx, centerChunk.chunkZ + dz));
    }
  }

  return freezeMinimapState({
    ...normalizeMinimapState(state),
    exploredChunkKeys: sortChunkKeys([...explored]),
    currentBiome: resolveBiomeAtPosition(options, position)
      ?? normalizeMinimapState(state).currentBiome
  });
}

export function setCurrentMinimapBiome(state, biome) {
  return freezeMinimapState({
    ...normalizeMinimapState(state),
    currentBiome: normalizeBiome(biome)
  });
}

export function discoverHearthlightMarker(state, marker) {
  const normalizedMarker = normalizeHearthlightMarker(marker);
  if (!normalizedMarker) return normalizeMinimapState(state);

  const markersById = new Map(
    normalizeMinimapState(state).hearthlights.map((existingMarker) => [existingMarker.id, existingMarker])
  );
  markersById.set(normalizedMarker.id, normalizedMarker);

  return freezeMinimapState({
    ...normalizeMinimapState(state),
    hearthlights: sortHearthlights([...markersById.values()])
  });
}

export function serializeMinimapState(state) {
  const normalized = normalizeMinimapState(state);

  return Object.freeze({
    version: MINIMAP_SNAPSHOT_VERSION,
    exploredChunkKeys: Object.freeze([...normalized.exploredChunkKeys]),
    currentBiome: normalized.currentBiome ? Object.freeze({ ...normalized.currentBiome }) : null,
    hearthlights: Object.freeze(normalized.hearthlights.map(cloneHearthlightMarker))
  });
}

export function restoreMinimapSnapshot(snapshot) {
  return normalizeMinimapState(snapshot);
}

export function buildMinimapViewModel(state, playerPosition, options = {}) {
  const normalized = normalizeMinimapState(state);
  const position = normalizePosition(playerPosition) ?? Object.freeze({ x: 0, y: 0, z: 0 });
  const chunkSize = normalizePositiveNumber(options.chunkSize, CHUNK_SIZE);
  const radius = Math.floor(normalizeNonNegativeNumber(
    options.radius ?? options.chunkRadius,
    DEFAULT_MINIMAP_VIEW_RADIUS
  ));
  const center = worldToChunkPosition(position, chunkSize);
  const explored = new Set(normalized.exploredChunkKeys);
  const chunks = [];

  for (let dz = -radius; dz <= radius; dz += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const chunkX = center.chunkX + dx;
      const chunkZ = center.chunkZ + dz;
      const key = createMinimapChunkKey(chunkX, chunkZ);
      chunks.push(Object.freeze({
        key,
        chunkX,
        chunkZ,
        offsetX: dx,
        offsetZ: dz,
        explored: explored.has(key),
        current: dx === 0 && dz === 0
      }));
    }
  }

  return Object.freeze({
    chunkSize,
    radius,
    diameter: radius * 2 + 1,
    center: Object.freeze({
      x: position.x,
      y: position.y,
      z: position.z,
      chunkX: center.chunkX,
      chunkZ: center.chunkZ,
      chunkKey: center.key
    }),
    currentBiome: normalized.currentBiome ? Object.freeze({ ...normalized.currentBiome }) : null,
    exploredChunkKeys: Object.freeze([...normalized.exploredChunkKeys]),
    chunks: Object.freeze(chunks),
    hearthlights: Object.freeze(normalized.hearthlights.map((marker) => {
      const relativeX = marker.position.x - position.x;
      const relativeZ = marker.position.z - position.z;
      const markerChunkX = worldToChunk(marker.position.x, chunkSize);
      const markerChunkZ = worldToChunk(marker.position.z, chunkSize);
      const offsetX = markerChunkX - center.chunkX;
      const offsetZ = markerChunkZ - center.chunkZ;

      return Object.freeze({
        ...cloneHearthlightMarker(marker),
        chunkX: markerChunkX,
        chunkZ: markerChunkZ,
        chunkKey: createMinimapChunkKey(markerChunkX, markerChunkZ),
        offsetX,
        offsetZ,
        visible: Math.abs(offsetX) <= radius && Math.abs(offsetZ) <= radius,
        relative: Object.freeze({ x: relativeX, z: relativeZ }),
        distance: Math.hypot(relativeX, relativeZ)
      });
    }))
  });
}

export function createMinimapChunkKey(chunkX, chunkZ) {
  return `${normalizeInteger(chunkX)},${normalizeInteger(chunkZ)}`;
}

export function parseMinimapChunkKey(key) {
  if (typeof key !== "string") return null;
  const parts = key.split(",");
  if (parts.length !== 2) return null;

  const chunkX = Number(parts[0]);
  const chunkZ = Number(parts[1]);
  if (!Number.isInteger(chunkX) || !Number.isInteger(chunkZ)) return null;

  return Object.freeze({ chunkX, chunkZ });
}

export function worldToChunk(value, chunkSize = CHUNK_SIZE) {
  return Math.floor(Number(value) / normalizePositiveNumber(chunkSize, CHUNK_SIZE));
}

export function worldToChunkPosition(position, chunkSize = CHUNK_SIZE) {
  const normalized = normalizePosition(position) ?? Object.freeze({ x: 0, y: 0, z: 0 });
  const chunkX = worldToChunk(normalized.x, chunkSize);
  const chunkZ = worldToChunk(normalized.z, chunkSize);

  return Object.freeze({
    chunkX,
    chunkZ,
    key: createMinimapChunkKey(chunkX, chunkZ)
  });
}

function normalizeMinimapState(state) {
  if (!state || typeof state !== "object") return EMPTY_MINIMAP_STATE;

  const exploredInput = state.exploredChunkKeys ?? state.exploredChunks ?? [];
  const markerInput = state.hearthlights ?? state.hearthlightMarkers ?? [];

  return freezeMinimapState({
    exploredChunkKeys: sortChunkKeys(normalizeChunkKeyList(exploredInput)),
    currentBiome: normalizeBiome(state.currentBiome ?? {
      id: state.currentBiomeId ?? state.biomeId,
      label: state.currentBiomeLabel ?? state.biomeLabel
    }),
    hearthlights: sortHearthlights(normalizeHearthlightList(markerInput))
  });
}

function freezeMinimapState(state) {
  return Object.freeze({
    exploredChunkKeys: Object.freeze([...state.exploredChunkKeys]),
    currentBiome: state.currentBiome ? Object.freeze({ ...state.currentBiome }) : null,
    hearthlights: Object.freeze(state.hearthlights.map(cloneHearthlightMarker))
  });
}

function resolveBiomeAtPosition(options, position) {
  if (options.biome !== undefined || options.currentBiome !== undefined) {
    return normalizeBiome(options.biome ?? options.currentBiome);
  }

  const source = options.biomeSource ?? options.world ?? null;
  if (!source) return null;

  if (typeof source === "function") {
    return normalizeBiome(source(position.x, position.z));
  }

  const biome =
    callBiomeSource(source, "biomeAt", position) ??
    callBiomeSource(source, "getBiomeAt", position) ??
    callBiomeSource(source, "sampleBiome", position) ??
    callBiomeSource(source, "sampleBiomeBlend", position) ??
    callBiomeSource(source, "terrainBiomeAt", position);

  if (biome) return normalizeBiome(biome);

  if (typeof source.sampleBiomeId === "function") {
    return normalizeBiome({ id: source.sampleBiomeId(position.x, position.z) });
  }

  return null;
}

function callBiomeSource(source, methodName, position) {
  if (typeof source[methodName] !== "function") return null;
  return source[methodName](position.x, position.z);
}

function normalizeBiome(biome) {
  if (!biome || typeof biome !== "object") return null;

  const rawId = biome.id ?? biome.key ?? biome.biomeId;
  if (rawId === null || rawId === undefined || rawId === "") return null;

  const id = String(rawId);
  const label = String(biome.label ?? biome.name ?? id);

  return Object.freeze({ id, label });
}

function normalizeChunkKeyList(input) {
  const values = normalizeListInput(input);
  const keys = new Set();

  for (const value of values) {
    if (typeof value === "string" && parseMinimapChunkKey(value)) {
      keys.add(value);
      continue;
    }

    if (value && typeof value === "object") {
      const chunkX = value.chunkX ?? value.cx ?? value.x;
      const chunkZ = value.chunkZ ?? value.cz ?? value.z;
      if (Number.isFinite(Number(chunkX)) && Number.isFinite(Number(chunkZ))) {
        keys.add(createMinimapChunkKey(chunkX, chunkZ));
      }
    }
  }

  return [...keys];
}

function normalizeHearthlightList(input) {
  const values = normalizeListInput(input);
  return values.map(normalizeHearthlightMarker).filter(Boolean);
}

function normalizeListInput(input) {
  if (Array.isArray(input)) return input;
  if (!input) return [];
  if (typeof input[Symbol.iterator] === "function") return [...input];
  if (typeof input === "object") return Object.values(input);
  return [];
}

function normalizeHearthlightMarker(marker) {
  if (!marker || typeof marker !== "object") return null;

  const rawId = marker.id ?? marker.markerId;
  const position = normalizePosition(marker.position ?? marker.origin ?? marker);
  if (rawId === null || rawId === undefined || rawId === "" || !position) return null;

  const id = String(rawId);
  return Object.freeze({
    id,
    name: String(marker.name ?? marker.label ?? "Hearthlight"),
    position
  });
}

function normalizePosition(position) {
  if (!position || typeof position !== "object") return null;

  const x = Number(position.x);
  const y = Number(position.y ?? 0);
  const z = Number(position.z);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;

  return Object.freeze({ x, y, z });
}

function cloneHearthlightMarker(marker) {
  return Object.freeze({
    id: marker.id,
    name: marker.name,
    position: Object.freeze({ ...marker.position })
  });
}

function sortChunkKeys(keys) {
  return [...keys].sort(compareChunkKeys);
}

function compareChunkKeys(leftKey, rightKey) {
  const left = parseMinimapChunkKey(leftKey);
  const right = parseMinimapChunkKey(rightKey);
  if (!left || !right) return String(leftKey).localeCompare(String(rightKey));
  return left.chunkZ - right.chunkZ || left.chunkX - right.chunkX;
}

function sortHearthlights(markers) {
  return [...markers].sort((left, right) => left.id.localeCompare(right.id));
}

function normalizePositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeNonNegativeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}
