import { fbm, lerp } from "../gen/Rng.js";

const DEFAULT_DETAIL = Object.freeze({
  amplitude: 0,
  frequency: 0.01,
  octaves: 2,
  seed: 0
});

export function loadAuthoredHeightmap(definition) {
  return new AuthoredHeightmap(definition);
}

export class AuthoredHeightmap {
  constructor(definition = {}) {
    const {
      id = "authored_heightmap",
      bounds,
      detail = DEFAULT_DETAIL
    } = definition;
    const { width, height, samples } = normalizeSamples(definition);

    this.id = String(id);
    this.bounds = freezeBounds(bounds, this.id);
    this.width = width;
    this.height = height;
    this.samples = Object.freeze(samples);
    this.detail = freezeDetail(detail);

    const macroMin = Math.min(...samples);
    const macroMax = Math.max(...samples);
    const activeDetailAmplitude = this.detail.frequency > 0 ? Math.abs(this.detail.amplitude) : 0;
    this.minHeight = macroMin - activeDetailAmplitude;
    this.maxHeight = macroMax + activeDetailAmplitude;

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

  macroHeightAt(worldX, worldZ) {
    if (!this.contains(worldX, worldZ)) return null;

    const gx = normaliseToGrid(worldX, this.bounds.minX, this.bounds.maxX, this.width);
    const gz = normaliseToGrid(worldZ, this.bounds.minZ, this.bounds.maxZ, this.height);
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = Math.min(this.width - 1, x0 + 1);
    const z1 = Math.min(this.height - 1, z0 + 1);
    const tx = gx - x0;
    const tz = gz - z0;
    const northWest = this._sampleGrid(x0, z0);
    const northEast = this._sampleGrid(x1, z0);
    const southWest = this._sampleGrid(x0, z1);
    const southEast = this._sampleGrid(x1, z1);
    const north = lerp(northWest, northEast, tx);
    const south = lerp(southWest, southEast, tx);

    return lerp(north, south, tz);
  }

  heightAt(worldX, worldZ) {
    const macroHeight = this.macroHeightAt(worldX, worldZ);
    if (!Number.isFinite(macroHeight)) return null;

    return macroHeight + this._detailAt(worldX, worldZ);
  }

  getHeightAt(worldX, worldZ) {
    return this.heightAt(worldX, worldZ);
  }

  sampleHeight(worldX, worldZ) {
    return this.heightAt(worldX, worldZ);
  }

  normalizedHeightAt(worldX, worldZ) {
    const height = this.heightAt(worldX, worldZ);
    if (!Number.isFinite(height)) return null;

    if (this.maxHeight <= this.minHeight) return 0.5;

    return clamp01((height - this.minHeight) / (this.maxHeight - this.minHeight));
  }

  _sampleGrid(x, z) {
    return this.samples[z * this.width + x];
  }

  _detailAt(worldX, worldZ) {
    if (this.detail.amplitude <= 0 || this.detail.frequency <= 0) return 0;

    const noise = fbm(worldX * this.detail.frequency, worldZ * this.detail.frequency, this.detail.seed, {
      octaves: this.detail.octaves
    });

    return (noise - 0.5) * 2 * this.detail.amplitude;
  }
}

function normalizeSamples(definition) {
  const rows = definition.samples ?? definition.values ?? definition.data;

  if (Array.isArray(rows) && Array.isArray(rows[0])) {
    const height = rows.length;
    const width = rows[0].length;
    const samples = [];

    if (width < 2 || height < 2) {
      throw new RangeError("Authored heightmap must be at least 2x2 samples.");
    }

    for (const row of rows) {
      if (!Array.isArray(row) || row.length !== width) {
        throw new TypeError("Authored heightmap rows must be rectangular.");
      }

      for (const value of row) samples.push(parseFinite(value, "height sample"));
    }

    return { width, height, samples };
  }

  const width = Number(definition.width);
  const height = Number(definition.height);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2) {
    throw new RangeError("Authored heightmap width and height must be integers of at least 2.");
  }

  if (!Array.isArray(rows) || rows.length !== width * height) {
    throw new TypeError("Authored heightmap flat samples must match width * height.");
  }

  return {
    width,
    height,
    samples: rows.map((value) => parseFinite(value, "height sample"))
  };
}

function freezeBounds(bounds, id) {
  if (!bounds || typeof bounds !== "object") {
    throw new TypeError(`Authored heightmap "${id}" requires bounds.`);
  }

  const minX = parseFinite(bounds.minX, "minX");
  const maxX = parseFinite(bounds.maxX, "maxX");
  const minZ = parseFinite(bounds.minZ, "minZ");
  const maxZ = parseFinite(bounds.maxZ, "maxZ");

  if (minX >= maxX || minZ >= maxZ) {
    throw new RangeError(`Authored heightmap "${id}" bounds must have positive area.`);
  }

  return Object.freeze({ minX, maxX, minZ, maxZ });
}

function freezeDetail(detail) {
  const merged = { ...DEFAULT_DETAIL, ...(detail ?? {}) };

  return Object.freeze({
    amplitude: Math.max(0, parseFinite(merged.amplitude, "detail amplitude")),
    frequency: Math.max(0, parseFinite(merged.frequency, "detail frequency")),
    octaves: Math.max(1, Math.floor(parseFinite(merged.octaves, "detail octaves"))),
    seed: Math.trunc(parseFinite(merged.seed, "detail seed"))
  });
}

function normaliseToGrid(worldValue, min, max, sampleCount) {
  const t = (worldValue - min) / (max - min);
  return clamp01(t) * (sampleCount - 1);
}

function parseFinite(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`Authored heightmap ${label} must be finite.`);
  }

  return parsed;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
