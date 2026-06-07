import { STARTER_BIOME_ID } from "../biomes/BiomeDefinitions.js";
import { terrainHeightAt } from "../gen/heightField.js";
import { mulberry32 } from "../gen/Rng.js";
import { CHUNK_SIZE, WORLD_SEED_DEFAULT } from "../gen/WorldConfig.js";
import { HEARTHMERE_CAMP_PREFAB } from "./prefabs/hearthmereCamp.js";

export const PREFAB_IDS = Object.freeze({
  HEARTHMERE_CAMP: HEARTHMERE_CAMP_PREFAB.id
});

const PREFAB_SALT = 0x48e2f3;
const HEARTHMERE_CANDIDATE_COUNT = 12;
const LEGACY_EXCLUSION_RADIUS = 12;
const LEGACY_EXCLUSION_POINTS = Object.freeze([
  Object.freeze({ x: 0, z: 3 }),   // player spawn
  Object.freeze({ x: 0, z: -4 }),  // training dummy
  Object.freeze({ x: 0, z: -14 }), // current fog gate
  Object.freeze({ x: 0, z: -20 })  // current boss placeholder
]);

export class PrefabRegistry {
  constructor(seed = WORLD_SEED_DEFAULT, options = {}) {
    this.seed = seed;
    this.biomeSource = options.biomeSource ?? null;
    this.heightSource = options.heightSource ?? null;
    this.anchors = Object.freeze([
      Object.freeze(this.createHearthmereCampAnchor())
    ]);
  }

  getPrefabAnchors() {
    return this.anchors;
  }

  getFootprints() {
    return this.anchors;
  }

  getAnchorById(id) {
    return this.anchors.find((anchor) => anchor.id === id) ?? null;
  }

  getPlacementsOverlappingChunk(cx, cz) {
    return this.anchors.filter((anchor) => doesPrefabOverlapChunk(anchor, cx, cz));
  }

  createHearthmereCampAnchor() {
    const origin = this.pickHearthmereOrigin();
    const basePadHeight = terrainHeightAt(
      origin.x,
      origin.z,
      this.seed,
      this.biomeSource,
      null,
      this.heightSource
    );

    return {
      ...HEARTHMERE_CAMP_PREFAB,
      origin: Object.freeze({
        x: origin.x,
        y: basePadHeight,
        z: origin.z
      }),
      padHeight: basePadHeight,
      biomeId: STARTER_BIOME_ID
    };
  }

  pickHearthmereOrigin() {
    const random = mulberry32((this.seed ^ PREFAB_SALT) | 0);
    let fallback = { x: 22, z: 18 };

    for (let index = 0; index < HEARTHMERE_CANDIDATE_COUNT; index += 1) {
      // Keep W-03 in the starter biome but away from the legacy boss/dummy line.
      const candidate = {
        x: roundToGrid(14 + random() * 26, 2),
        z: roundToGrid(12 + random() * 24, 2)
      };

      fallback = candidate;

      if (this.isValidHearthmereCampOrigin(candidate)) {
        return candidate;
      }
    }

    return fallback;
  }

  sampleBiomeId(worldX, worldZ) {
    if (this.biomeSource && typeof this.biomeSource.sampleBiomeId === "function") {
      return this.biomeSource.sampleBiomeId(worldX, worldZ);
    }

    if (this.biomeSource && typeof this.biomeSource.sampleSpawnSafeBiome === "function") {
      return this.biomeSource.sampleSpawnSafeBiome(worldX, worldZ).biomeId;
    }

    return STARTER_BIOME_ID;
  }

  isValidHearthmereCampOrigin(candidate) {
    if (isLegacyExcluded(candidate)) return false;

    return isFootprintInsideBiome(
      candidate,
      HEARTHMERE_CAMP_PREFAB.footprintRadius,
      STARTER_BIOME_ID,
      (x, z) => this.sampleBiomeId(x, z)
    );
  }
}

function roundToGrid(value, gridSize) {
  return Math.round(value / gridSize) * gridSize;
}

function isLegacyExcluded(candidate) {
  return LEGACY_EXCLUSION_POINTS.some((point) => {
    const dx = candidate.x - point.x;
    const dz = candidate.z - point.z;
    return dx * dx + dz * dz < LEGACY_EXCLUSION_RADIUS * LEGACY_EXCLUSION_RADIUS;
  });
}

function doesPrefabOverlapChunk(anchor, cx, cz) {
  const minX = cx * CHUNK_SIZE;
  const minZ = cz * CHUNK_SIZE;
  const maxX = minX + CHUNK_SIZE;
  const maxZ = minZ + CHUNK_SIZE;
  const closestX = Math.min(maxX, Math.max(minX, anchor.origin.x));
  const closestZ = Math.min(maxZ, Math.max(minZ, anchor.origin.z));
  const dx = closestX - anchor.origin.x;
  const dz = closestZ - anchor.origin.z;

  return dx * dx + dz * dz <= anchor.footprintRadius * anchor.footprintRadius;
}

function isFootprintInsideBiome(origin, radius, biomeId, sampleBiomeId) {
  const sampleCount = 16;

  if (sampleBiomeId(origin.x, origin.z) !== biomeId) return false;

  for (let index = 0; index < sampleCount; index += 1) {
    const angle = (index / sampleCount) * Math.PI * 2;
    const x = origin.x + Math.cos(angle) * radius;
    const z = origin.z + Math.sin(angle) * radius;

    if (sampleBiomeId(x, z) !== biomeId) return false;
  }

  return true;
}
