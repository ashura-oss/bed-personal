import * as THREE from "three";
import { TerrainGenerator } from "../gen/TerrainGenerator.js";
import { CHUNK_SIZE, LOAD_RADIUS, MAX_CHUNK_BUILDS_PER_TICK, UNLOAD_PAD } from "../gen/WorldConfig.js";
import { Chunk, chunkKey } from "./Chunk.js";

/**
 * ChunkManager — streams procedural terrain chunks around the player.
 *
 * - Loads an (2·LOAD_RADIUS+1)^2 grid centred on the player's chunk.
 * - Builds at most MAX_CHUNK_BUILDS_PER_TICK chunks per update (frame budget),
 *   nearest-first, so generation never stalls the frame.
 * - Unloads chunks beyond LOAD_RADIUS+UNLOAD_PAD (hysteresis prevents thrash).
 * - One shared material across all chunks keeps draw-call/material cost flat.
 */
export class ChunkManager {
  constructor(scene, rapier, seed, options = {}) {
    this.loaded = new Map();
    /** Pre-sorted (nearest-first) build queue. Rebuilt only on chunk-boundary crossing. */
    this.pendingQueue = [];
    this.queueCursor = 0;
    this.currentCx = Number.NaN;
    this.currentCz = Number.NaN;

    this.scene = scene;
    this.rapier = rapier;
    this.biomeSource = options.biomeSource ?? null;
    this.generator = new TerrainGenerator(seed, {
      biomeSource: options.biomeSource,
      prefabSource: options.prefabSource,
      heightSource: options.heightSource
    });
    this.prefabLoader = options.prefabLoader ?? null;
    this.gatheringSystem = options.gatheringSystem ?? null;
    this.enemySpawner = options.enemySpawner ?? null;
    this.npcSpawner = options.npcSpawner ?? null;
    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffffff),
      roughness: 0.96,
      metalness: 0.0,
      flatShading: false,
      vertexColors: true
    });
  }

  /** Terrain height at any world point — used to place entities on the ground. */
  sampleHeight(x, z) {
    return this.generator.heightAt(x, z);
  }

  sampleBiome(x, z) {
    return this.generator.biomeAt(x, z);
  }

  sampleAtmosphereBiome(x, z) {
    return this.sampleRuntimeBiome(x, z) ?? this.generator.biomeAt(x, z);
  }

  sampleRuntimeBiome(x, z) {
    const source = this.biomeSource ?? null;

    if (typeof source === "function") {
      return source(x, z);
    }

    if (source && typeof source.biomeAt === "function") {
      const biome = source.biomeAt(x, z);
      if (biome) return biome;
    }

    if (source && typeof source.getBiomeAt === "function") {
      const biome = source.getBiomeAt(x, z);
      if (biome) return biome;
    }

    if (source && typeof source.terrainBiomeAt === "function") {
      return source.terrainBiomeAt(x, z);
    }

    return null;
  }

  /** Convert a world position to its chunk coordinate. */
  static worldToChunk(value) {
    return Math.floor(value / CHUNK_SIZE);
  }

  /**
   * Synchronously build a small area around the spawn so the player has solid
   * ground the instant they appear. Call once before the loop starts.
   */
  ensureSpawnArea(spawnX = 0, spawnZ = 0, radius = 1) {
    const cx = ChunkManager.worldToChunk(spawnX);
    const cz = ChunkManager.worldToChunk(spawnZ);

    for (let dz = -radius; dz <= radius; dz += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        this.buildChunk(cx + dx, cz + dz);
      }
    }

    // Leave currentCx/Cz at NaN so the first update() does a full-radius refresh
    // and streams in the rest of the view distance beyond this spawn core.
  }

  /**
   * Stream chunks around the player. Call once per render frame with the
   * player's world position.
   */
  update(playerX, playerZ) {
    const cx = ChunkManager.worldToChunk(playerX);
    const cz = ChunkManager.worldToChunk(playerZ);

    // Recompute the desired set when the player crosses a chunk boundary.
    if (cx !== this.currentCx || cz !== this.currentCz) {
      this.currentCx = cx;
      this.currentCz = cz;
      this.refreshPending(cx, cz);
      this.unloadFar(cx, cz);
    }

    this.processPending();
  }

  dispose() {
    for (const chunk of this.loaded.values()) {
      if (this.gatheringSystem) this.gatheringSystem.despawnNodesForChunk(chunk.cx, chunk.cz);
      if (this.enemySpawner) this.enemySpawner.despawnEnemiesForChunk(chunk.cx, chunk.cz);
      if (this.npcSpawner) this.npcSpawner.despawnNpcsForChunk(chunk.cx, chunk.cz);
      this.prefabLoader?.unloadChunk?.(chunk.cx, chunk.cz);
      chunk.dispose();
    }

    this.enemySpawner?.dispose();
    this.npcSpawner?.dispose();
    this.loaded.clear();
    this.pendingQueue = [];
    this.queueCursor = 0;
    this.material.dispose();
  }

  // Private

  /**
   * Rebuild the prioritised build queue for the player's current chunk.
   * Runs ONCE per chunk-boundary crossing — the sort cost is paid here, not
   * per-frame. Nearest-first so the player's surroundings fill in first.
   */
  refreshPending(cx, cz) {
    const next = [];

    for (let dz = -LOAD_RADIUS; dz <= LOAD_RADIUS; dz += 1) {
      for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx += 1) {
        const nextCx = cx + dx;
        const nextCz = cz + dz;
        const key = chunkKey(nextCx, nextCz);

        if (!this.loaded.has(key)) {
          next.push({
            key,
            cx: nextCx,
            cz: nextCz,
            dist: dx * dx + dz * dz
          });
        }
      }
    }

    next.sort((a, b) => a.dist - b.dist);
    this.pendingQueue = next.map(({ key, cx: nextCx, cz: nextCz }) => ({
      key,
      cx: nextCx,
      cz: nextCz
    }));
    this.queueCursor = 0;
  }

  /**
   * Build up to the per-tick budget from the pre-sorted queue. No allocation
   * on the steady-state path — advances a cursor instead of re-sorting.
   */
  processPending() {
    if (this.queueCursor >= this.pendingQueue.length) return;

    let built = 0;

    while (built < MAX_CHUNK_BUILDS_PER_TICK && this.queueCursor < this.pendingQueue.length) {
      const entry = this.pendingQueue[this.queueCursor];
      this.queueCursor += 1;

      if (!this.loaded.has(entry.key)) {
        this.buildChunk(entry.cx, entry.cz);
        built += 1;
      }
    }
  }

  /** Remove loaded chunks outside the keep radius. */
  unloadFar(cx, cz) {
    const keep = LOAD_RADIUS + UNLOAD_PAD;

    for (const [key, chunk] of this.loaded.entries()) {
      if (Math.abs(chunk.cx - cx) > keep || Math.abs(chunk.cz - cz) > keep) {
        if (this.gatheringSystem) this.gatheringSystem.despawnNodesForChunk(chunk.cx, chunk.cz);
        if (this.enemySpawner) this.enemySpawner.despawnEnemiesForChunk(chunk.cx, chunk.cz);
        if (this.npcSpawner) this.npcSpawner.despawnNpcsForChunk(chunk.cx, chunk.cz);
        this.prefabLoader?.unloadChunk?.(chunk.cx, chunk.cz);
        chunk.dispose();
        this.loaded.delete(key);
      }
    }
  }

  buildChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    if (this.loaded.has(key)) return;

    const chunk = new Chunk(this.scene, this.rapier, this.generator, this.material, cx, cz);
    this.loaded.set(key, chunk);
    this.prefabLoader?.ensureChunk?.(cx, cz);
    const chunkCenterX = (cx + 0.5) * CHUNK_SIZE;
    const chunkCenterZ = (cz + 0.5) * CHUNK_SIZE;
    const canSpawnStreamedContent = this.shouldSpawnStreamedContentForChunk(cx, cz);

    if (this.gatheringSystem && canSpawnStreamedContent) {
      const biome = this.generator.biomeAt(chunkCenterX, chunkCenterZ);
      const biomeId = biome.key ?? biome.id ?? 'hearthmere';
      const heightAt = (x, z) => this.generator.heightAt(x, z);
      this.gatheringSystem.spawnNodesForChunk(cx, cz, biomeId, heightAt);
    }
    if (this.enemySpawner && canSpawnStreamedContent) {
      const biome = this.generator.biomeAt(chunkCenterX, chunkCenterZ);
      const biomeId = biome.key ?? biome.id ?? 'hearthmere';
      const heightAt = (x, z) => this.generator.heightAt(x, z);
      this.enemySpawner.spawnEnemiesForChunk(cx, cz, biomeId, heightAt);
    }
    if (this.npcSpawner && canSpawnStreamedContent) {
      this.npcSpawner.spawnNpcsForChunk(cx, cz);
    }
  }

  shouldSpawnStreamedContentAt(worldX, worldZ) {
    if (this.biomeSource && typeof this.biomeSource.findRegionAt === "function") {
      return Boolean(this.biomeSource.findRegionAt(worldX, worldZ));
    }

    return true;
  }

  shouldSpawnStreamedContentForChunk(chunkX, chunkZ) {
    if (this.biomeSource && typeof this.biomeSource.getRegions === "function") {
      const minX = chunkX * CHUNK_SIZE;
      const minZ = chunkZ * CHUNK_SIZE;
      const maxX = minX + CHUNK_SIZE;
      const maxZ = minZ + CHUNK_SIZE;

      return this.biomeSource.getRegions().some((region) => (
        maxX >= region.bounds.minX &&
        minX <= region.bounds.maxX &&
        maxZ >= region.bounds.minZ &&
        minZ <= region.bounds.maxZ
      ));
    }

    const centerX = (chunkX + 0.5) * CHUNK_SIZE;
    const centerZ = (chunkZ + 0.5) * CHUNK_SIZE;
    return this.shouldSpawnStreamedContentAt(centerX, centerZ);
  }
}
