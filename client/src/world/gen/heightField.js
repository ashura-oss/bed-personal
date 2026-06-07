import {
  TERRAIN_BASE_HEIGHT
} from "./WorldConfig.js";
import { applyPrefabHeightBlend } from "../prefab/PrefabFootprint.js";

const FALLBACK_BIOME = Object.freeze({
  key: "hearthmere",
  name: "Hearthmere",
  terrain: {
    amplitude: 7,
    baseHeight: TERRAIN_BASE_HEIGHT
  },
  palette: {
    low: 0x4a4636,
    high: 0x8d7d58
  },
  atmosphere: {
    background: 0x080b10,
    fogColor: 0x101016,
    fogDensity: 0.038
  }
});

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
export function terrainHeightAt(worldX, worldZ, seed, biomeSource, prefabSource, heightSource = null) {
  return terrainSampleAt(worldX, worldZ, seed, biomeSource, prefabSource, heightSource).height;
}

export function terrainSampleAt(worldX, worldZ, seed, biomeSource, prefabSource, heightSource = null) {
  const biome = resolveBiomeAt(worldX, worldZ, biomeSource);
  const authoredHeight = sampleRawHeight(worldX, worldZ, heightSource);
  let normalised = 0.5;
  let baseHeight;

  if (Number.isFinite(authoredHeight)) {
    baseHeight = authoredHeight;
    normalised = normalizeAuthoredHeight(worldX, worldZ, authoredHeight, heightSource);
  } else {
    baseHeight = biome.terrain?.baseHeight ?? 0;
  }

  const height = applyPrefabHeightBlend(baseHeight, worldX, worldZ, prefabSource);

  return {
    biome,
    height,
    baseHeight,
    normalizedHeight: clamp01(normalised)
  };
}

export function resolveBiomeAt(worldX, worldZ, biomeSource) {
  const rawBiome = sampleRawBiome(worldX, worldZ, biomeSource);
  return normaliseBiome(rawBiome);
}

export function normaliseBiome(rawBiome) {
  const biome = rawBiome ?? FALLBACK_BIOME;
  const terrain = isObject(biome.terrain) ? biome.terrain : {};
  const palette = isObject(biome.palette)
    ? biome.palette
    : isObject(biome.colors)
      ? biome.colors
      : {};
  const atmosphere = isObject(biome.atmosphere)
    ? biome.atmosphere
    : isObject(biome.weather)
      ? biome.weather
      : {};
  const low = firstDefined(
    palette.low,
    palette.base,
    palette.groundLow,
    palette.ground,
    biome.groundColor,
    biome.color,
    FALLBACK_BIOME.palette.low
  );
  const high = firstDefined(
    palette.high,
    palette.top,
    palette.groundHigh,
    palette.peak,
    biome.accentColor,
    biome.peakColor,
    low,
    FALLBACK_BIOME.palette.high
  );
  const background = firstDefined(
    atmosphere.background,
    atmosphere.sky,
    palette.sky,
    biome.backgroundColor,
    biome.skyColor,
    biome.fogColor,
    biome.accentColor,
    FALLBACK_BIOME.atmosphere.background
  );
  const fogColor = firstDefined(
    atmosphere.fogColor,
    atmosphere.fog,
    palette.fog,
    biome.fogColor,
    background,
    FALLBACK_BIOME.atmosphere.fogColor
  );

  return {
    ...biome,
    key: String(firstDefined(biome.key, biome.id, biome.name, FALLBACK_BIOME.key)),
    name: String(firstDefined(biome.name, biome.label, biome.id, FALLBACK_BIOME.name)),
    terrain: {
      ...terrain,
      amplitude: Math.max(0, firstFinite(
        FALLBACK_BIOME.terrain.amplitude,
        terrain.amplitude,
        terrain.heightAmplitude,
        terrain.relief,
        biome.terrainAmplitude,
        biome.amplitude,
        biome.relief
      )),
      baseHeight: firstFinite(
        FALLBACK_BIOME.terrain.baseHeight,
        terrain.baseHeight,
        terrain.base,
        terrain.heightOffset,
        biome.terrainBaseHeight,
        biome.baseHeight,
        biome.heightOffset
      )
    },
    palette: {
      ...palette,
      low,
      high
    },
    atmosphere: {
      ...atmosphere,
      background,
      fogColor,
      fogDensity: Math.max(0, firstFinite(
        FALLBACK_BIOME.atmosphere.fogDensity,
        atmosphere.fogDensity,
        biome.fogDensity
      ))
    }
  };
}

function sampleRawBiome(worldX, worldZ, biomeSource) {
  const source = biomeSource ?? null;

  if (typeof source === "function") {
    return source(worldX, worldZ);
  }

  if (source && typeof source.terrainBiomeAt === "function") {
    return source.terrainBiomeAt(worldX, worldZ);
  }

  if (source && typeof source.sampleBiomeBlend === "function") {
    return source.sampleBiomeBlend(worldX, worldZ);
  }

  if (source && typeof source.getBiomeAt === "function") {
    return source.getBiomeAt(worldX, worldZ);
  }

  if (source && typeof source.biomeAt === "function") {
    return source.biomeAt(worldX, worldZ);
  }

  if (source && typeof source.sampleBiomeAt === "function") {
    return source.sampleBiomeAt(worldX, worldZ);
  }

  if (source && typeof source.sampleBiome === "function") {
    return source.sampleBiome(worldX, worldZ);
  }

  if (source && typeof source.sampleSpawnSafeBiome === "function") {
    return source.sampleSpawnSafeBiome(worldX, worldZ).biome;
  }

  return null;
}

function sampleRawHeight(worldX, worldZ, heightSource) {
  const source = heightSource ?? null;

  if (typeof source === "function") {
    return source(worldX, worldZ);
  }

  if (source && typeof source.terrainHeightAt === "function") {
    return source.terrainHeightAt(worldX, worldZ);
  }

  if (source && typeof source.getHeightAt === "function") {
    return source.getHeightAt(worldX, worldZ);
  }

  if (source && typeof source.heightAt === "function") {
    return source.heightAt(worldX, worldZ);
  }

  if (source && typeof source.sampleHeight === "function") {
    return source.sampleHeight(worldX, worldZ);
  }

  return null;
}

function normalizeAuthoredHeight(worldX, worldZ, height, heightSource) {
  const source = heightSource ?? null;

  if (source && typeof source.terrainNormalizedHeightAt === "function") {
    const normalized = source.terrainNormalizedHeightAt(worldX, worldZ);
    if (Number.isFinite(normalized)) return clamp01(normalized);
  }

  if (source && typeof source.normalizedHeightAt === "function") {
    const normalized = source.normalizedHeightAt(worldX, worldZ);
    return Number.isFinite(normalized) ? clamp01(normalized) : 0.5;
  }

  const minHeight = Number(source?.minHeight);
  const maxHeight = Number(source?.maxHeight);

  if (Number.isFinite(minHeight) && Number.isFinite(maxHeight) && maxHeight > minHeight) {
    return clamp01((height - minHeight) / (maxHeight - minHeight));
  }

  return 0.5;
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }

  return undefined;
}

function firstFinite(fallback, ...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
