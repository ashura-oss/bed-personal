const BASE_MASK_VALUE = "base";

export function loadAuthoredBiomeMask(definition) {
  return new AuthoredBiomeMask(definition);
}

export class AuthoredBiomeMask {
  constructor(definition = {}) {
    const {
      id = "authored_biome_mask",
      bounds,
      palette = {},
      subBiomes = {}
    } = definition;
    const { width, height, samples } = normalizeSamples(definition);

    this.id = String(id);
    this.bounds = freezeBounds(bounds, this.id);
    this.width = width;
    this.height = height;
    this.palette = Object.freeze({ ...palette });
    this.subBiomes = freezeSubBiomes(subBiomes);
    this.samples = Object.freeze(samples);

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

  sampleWeights(worldX, worldZ) {
    if (!this.contains(worldX, worldZ)) return null;

    const gx = normaliseToGrid(worldX, this.bounds.minX, this.bounds.maxX, this.width);
    const gz = normaliseToGrid(worldZ, this.bounds.minZ, this.bounds.maxZ, this.height);
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = Math.min(this.width - 1, x0 + 1);
    const z1 = Math.min(this.height - 1, z0 + 1);
    const tx = gx - x0;
    const tz = gz - z0;
    const weights = {};

    addDecodedWeight(weights, this._decodeSample(x0, z0), (1 - tx) * (1 - tz));
    addDecodedWeight(weights, this._decodeSample(x1, z0), tx * (1 - tz));
    addDecodedWeight(weights, this._decodeSample(x0, z1), (1 - tx) * tz);
    addDecodedWeight(weights, this._decodeSample(x1, z1), tx * tz);

    const entries = normalizeConvexWeightEntries(Object.entries(weights));
    if (!entries.length) return null;

    return Object.freeze(Object.fromEntries(entries));
  }

  sampleDominantId(worldX, worldZ) {
    const weights = this.sampleWeights(worldX, worldZ);
    if (!weights) return null;

    return Object.entries(weights).reduce((best, [id, weight]) => (
      !best || weight > best.weight ? { id, weight } : best
    ), null)?.id ?? null;
  }

  biomeAt(baseBiome, worldX, worldZ) {
    const weights = this.sampleWeights(worldX, worldZ);
    if (!weights) return null;

    return blendBiomeDefinition(baseBiome, this.subBiomes, weights);
  }

  _decodeSample(x, z) {
    const raw = this.samples[z * this.width + x];

    if (raw === null || raw === undefined || raw === BASE_MASK_VALUE) return null;

    if (typeof raw === "object" && !Array.isArray(raw)) {
      return raw;
    }

    return this.palette[String(raw)] ?? raw;
  }
}

export function blendBiomeDefinition(baseBiome, subBiomes, weights) {
  if (!baseBiome || !weights) return null;

  const entries = normalizeConvexWeightEntries(
    Object.entries(weights).filter(([id]) => Boolean(subBiomes[id]))
  ).map(([id, weight]) => [id, subBiomes[id], weight]);

  if (!entries.length) return null;

  const totalWeight = clamp01(entries.reduce((sum, [, , weight]) => sum + weight, 0));
  const dominant = entries.reduce((best, [id, , weight]) => (
    !best || weight > best.weight ? { id, weight } : best
  ), null);
  const blended = {
    ...baseBiome,
    _zoneId: dominant?.id ?? null,
    _maskWeights: Object.freeze(Object.fromEntries(entries.map(([id, , weight]) => [id, weight])))
  };

  for (const field of ["fogDensity", "terrainAmplitude", "terrainBaseHeight", "roughness", "metalness"]) {
    blended[field] = blendNumberField(baseBiome, entries, totalWeight, field);
  }

  for (const field of ["groundColor", "accentColor", "backgroundColor", "fogColor"]) {
    blended[field] = blendColorField(baseBiome, entries, totalWeight, field);
  }

  return Object.freeze(blended);
}

function normalizeSamples(definition) {
  const rows = definition.samples ?? definition.values ?? definition.data;

  if (Array.isArray(rows) && Array.isArray(rows[0])) {
    const height = rows.length;
    const width = rows[0].length;
    const samples = [];

    if (width < 2 || height < 2) {
      throw new RangeError("Authored biome mask must be at least 2x2 samples.");
    }

    for (const row of rows) {
      if (!Array.isArray(row) || row.length !== width) {
        throw new TypeError("Authored biome mask rows must be rectangular.");
      }

      samples.push(...row);
    }

    return { width, height, samples };
  }

  const width = Number(definition.width);
  const height = Number(definition.height);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2) {
    throw new RangeError("Authored biome mask width and height must be integers of at least 2.");
  }

  if (!Array.isArray(rows) || rows.length !== width * height) {
    throw new TypeError("Authored biome mask flat samples must match width * height.");
  }

  return { width, height, samples: rows.slice() };
}

function freezeBounds(bounds, id) {
  if (!bounds || typeof bounds !== "object") {
    throw new TypeError(`Authored biome mask "${id}" requires bounds.`);
  }

  const minX = parseFinite(bounds.minX, "minX");
  const maxX = parseFinite(bounds.maxX, "maxX");
  const minZ = parseFinite(bounds.minZ, "minZ");
  const maxZ = parseFinite(bounds.maxZ, "maxZ");

  if (minX >= maxX || minZ >= maxZ) {
    throw new RangeError(`Authored biome mask "${id}" bounds must have positive area.`);
  }

  return Object.freeze({ minX, maxX, minZ, maxZ });
}

function freezeSubBiomes(subBiomes) {
  return Object.freeze(Object.fromEntries(
    Object.entries(subBiomes).map(([id, definition]) => [id, Object.freeze({ ...definition })])
  ));
}

function addDecodedWeight(weights, decoded, weight) {
  const sampleWeight = Number(weight);

  if (
    !Number.isFinite(sampleWeight) ||
    sampleWeight <= 0 ||
    decoded === null ||
    decoded === undefined ||
    decoded === BASE_MASK_VALUE
  ) {
    return;
  }

  if (typeof decoded === "object" && !Array.isArray(decoded)) {
    for (const [id, nextWeight] of normalizeExplicitChannelEntries(Object.entries(decoded))) {
      addDecodedWeight(weights, id, sampleWeight * nextWeight);
    }
    return;
  }

  const id = String(decoded);
  if (id === BASE_MASK_VALUE) return;

  weights[id] = (weights[id] ?? 0) + sampleWeight;
}

function blendNumberField(baseBiome, entries, totalWeight, field) {
  const baseValue = Number(baseBiome[field]);
  if (!Number.isFinite(baseValue)) return baseBiome[field];

  return entries.reduce((sum, [, subBiome, weight]) => {
    const value = Number.isFinite(Number(subBiome[field])) ? Number(subBiome[field]) : baseValue;
    return sum + value * weight;
  }, baseValue * (1 - totalWeight));
}

function blendColorField(baseBiome, entries, totalWeight, field) {
  const base = parseHexColor(baseBiome[field]);
  if (!base) {
    const validEntries = entries
      .map(([, subBiome, weight]) => [parseHexColor(subBiome[field]), weight])
      .filter(([color, weight]) => color && weight > 0);

    if (!validEntries.length) return baseBiome[field];

    const validWeight = validEntries.reduce((sum, [, weight]) => sum + weight, 0);
    const color = validEntries.reduce((sum, [next, weight]) => ({
      r: sum.r + next.r * weight,
      g: sum.g + next.g * weight,
      b: sum.b + next.b * weight
    }), { r: 0, g: 0, b: 0 });
    const scale = validWeight > 0 ? 1 / validWeight : 0;

    return `#${toHexPair(color.r * scale)}${toHexPair(color.g * scale)}${toHexPair(color.b * scale)}`;
  }

  const color = entries.reduce((sum, [, subBiome, weight]) => {
    const next = parseHexColor(subBiome[field]) ?? base;
    return {
      r: sum.r + next.r * weight,
      g: sum.g + next.g * weight,
      b: sum.b + next.b * weight
    };
  }, {
    r: base.r * (1 - totalWeight),
    g: base.g * (1 - totalWeight),
    b: base.b * (1 - totalWeight)
  });

  return `#${toHexPair(color.r)}${toHexPair(color.g)}${toHexPair(color.b)}`;
}

function parseHexColor(value) {
  if (typeof value !== "string") return null;

  const hex = value.replace("#", "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const expanded = hex.length === 3
    ? hex.split("").map((char) => char + char).join("")
    : hex;

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16)
  };
}

function toHexPair(value) {
  return Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0");
}

function normaliseToGrid(worldValue, min, max, sampleCount) {
  const t = (worldValue - min) / (max - min);
  return clamp01(t) * (sampleCount - 1);
}

function parseFinite(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`Authored biome mask ${label} must be finite.`);
  }

  return parsed;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function normalizeExplicitChannelEntries(entries) {
  const channels = [];
  let totalWeight = 0;

  for (const [id, rawWeight] of entries) {
    const weight = sanitizeWeight(rawWeight);
    if (weight <= 0) continue;

    totalWeight += weight;
    if (String(id) !== BASE_MASK_VALUE) {
      channels.push([String(id), weight]);
    }
  }

  if (totalWeight <= 1) return channels;

  return channels.map(([id, weight]) => [id, weight / totalWeight]);
}

function normalizeConvexWeightEntries(entries) {
  const weights = entries
    .map(([id, rawWeight]) => [String(id), sanitizeWeight(rawWeight)])
    .filter(([id, weight]) => id !== BASE_MASK_VALUE && weight > 0);

  const totalWeight = weights.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight <= 1) return weights;

  return weights.map(([id, weight]) => [id, weight / totalWeight]);
}

function sanitizeWeight(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}
