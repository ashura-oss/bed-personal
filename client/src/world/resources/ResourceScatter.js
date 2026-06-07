import { hash2 } from "../gen/Rng.js";
import { CHUNK_SIZE } from "../gen/WorldConfig.js";
import { samplePrefabInfluence } from "../prefab/PrefabFootprint.js";
import { getResourcesForBiome } from "./ResourceDefinitions.js";

/**
 * ResourceScatter — deterministic, seed-driven node placement per chunk.
 *
 * Zero Math.random(). All randomness derives from hash2(worldSeed, ...).
 * The same (worldSeed, chunkX, chunkZ) always produces the identical layout,
 * so chunks are reproducible across sessions and stream in correctly.
 *
 * Placement rules:
 *  - 4–8 attempts per chunk (driven by the hash)
 *  - Biome filter: only definitions whose `biomes` list includes the biome
 *  - Minimum separation: 3 world units between any two nodes in the chunk
 *  - Nodes are placed in a uniform grid jitter within the chunk bounds
 */

const MIN_SEPARATION = 3;
const MAX_NODES_PER_CHUNK = 8;
const MIN_NODES_PER_CHUNK = 4;

// Interior padding so nodes don't hang right at chunk edge seams
const EDGE_PAD = 2;

/**
 * Map a hash float [0,1) to an integer in [min, max].
 */
function hashToInt(value, min, max) {
  return min + Math.floor(value * (max - min + 1));
}

export class ResourceScatter {
  /**
   * @param {{ worldSeed: number, biomeMap: object, prefabSource?: object }} options
   */
  constructor({ worldSeed, biomeMap, prefabSource = null }) {
    this._worldSeed = worldSeed | 0;
    this._biomeMap = biomeMap;
    this._prefabSource = prefabSource;
  }

  /**
   * Return placement descriptors for one chunk.
   *
   * @param {number} chunkX
   * @param {number} chunkZ
   * @param {string} biomeId
   * @param {function} heightAt  — (worldX, worldZ) => number
   * @returns {Array<{ worldX: number, worldZ: number, definition: object }>}
   */
  getNodesForChunk(chunkX, chunkZ, biomeId, heightAt) {
    const availableDefs = getResourcesForBiome(biomeId);
    if (availableDefs.length === 0) return [];
    // Sample chunk centre height — skip the chunk if it is completely submerged
    const chunkCentreX = (chunkX + 0.5) * CHUNK_SIZE;
    const chunkCentreZ = (chunkZ + 0.5) * CHUNK_SIZE;
    if (heightAt(chunkCentreX, chunkCentreZ) < -8) return [];

    const seed = this._worldSeed;

    // Deterministic number of nodes for this chunk (4–8)
    const countHash = hash2(chunkX * 7 + 3, chunkZ * 11 + 5, seed ^ 0xdeadbeef);
    const nodeCount = hashToInt(countHash, MIN_NODES_PER_CHUNK, MAX_NODES_PER_CHUNK);

    const originX = chunkX * CHUNK_SIZE;
    const originZ = chunkZ * CHUNK_SIZE;
    const inner = CHUNK_SIZE - EDGE_PAD * 2;

    const placed = [];

    for (let i = 0; i < nodeCount; i += 1) {
      // Unique hash per (seed, chunkX, chunkZ, i)
      const hx = hash2(chunkX * 31 + i, chunkZ * 17, seed ^ 0x1a2b3c4d);
      const hz = hash2(chunkX * 13, chunkZ * 29 + i, seed ^ 0x5e6f7a8b);
      const hd = hash2(i * 97 + chunkX, chunkZ - i * 53, seed ^ 0xc0ffee00);

      const worldX = originX + EDGE_PAD + hx * inner;
      const worldZ = originZ + EDGE_PAD + hz * inner;

      if (samplePrefabInfluence(worldX, worldZ, this._prefabSource).influence > 0) {
        continue;
      }

      // Rejection: skip if too close to an already-placed node in this chunk
      let tooClose = false;
      for (const existing of placed) {
        const dx = worldX - existing.worldX;
        const dz = worldZ - existing.worldZ;
        if (dx * dx + dz * dz < MIN_SEPARATION * MIN_SEPARATION) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Pick definition for this slot
      const nodeBiomeId = this._sampleBiomeId(worldX, worldZ, biomeId);
      const nodeDefs = nodeBiomeId === biomeId ? availableDefs : getResourcesForBiome(nodeBiomeId);
      if (nodeDefs.length === 0) continue;

      const defIndex = Math.floor(hd * nodeDefs.length);
      const definition = nodeDefs[Math.min(defIndex, nodeDefs.length - 1)];

      placed.push({ worldX, worldZ, definition });
    }

    return placed;
  }

  _sampleBiomeId(worldX, worldZ, fallbackBiomeId) {
    if (this._biomeMap && typeof this._biomeMap.sampleBiomeId === "function") {
      return this._biomeMap.sampleBiomeId(worldX, worldZ) ?? this._missingBiomeFallback(fallbackBiomeId);
    }

    if (this._biomeMap && typeof this._biomeMap.sampleSpawnSafeBiome === "function") {
      return this._biomeMap.sampleSpawnSafeBiome(worldX, worldZ).biomeId ?? this._missingBiomeFallback(fallbackBiomeId);
    }

    if (this._biomeMap && typeof this._biomeMap.biomeAt === "function") {
      const biome = this._biomeMap.biomeAt(worldX, worldZ);
      return biome?.key ?? biome?.id ?? this._missingBiomeFallback(fallbackBiomeId);
    }

    return fallbackBiomeId;
  }

  _missingBiomeFallback(fallbackBiomeId) {
    return typeof this._biomeMap?.findRegionAt === "function" ? null : fallbackBiomeId;
  }
}
