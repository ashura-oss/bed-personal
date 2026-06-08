import { hash2, mulberry32 } from "../../world/gen/Rng.js";
import { CHUNK_SIZE } from "../../world/gen/WorldConfig.js";
import { getEnemiesForBiome, getEnemyDefinitionForPlacementTags } from "./EnemyDefinitions.js";
import { WanderingEnemy } from "./WanderingEnemy.js";
import { WanderingEnemyVisual } from "./WanderingEnemyVisual.js";

/**
 * EnemySpawner — manages enemy lifecycle per chunk.
 *
 * Mirrors the GatheringSystem pattern: spawn on chunk load, despawn on
 * chunk unload, update all active enemies each frame.
 *
 * Architecture constraints:
 *  - Does NOT import Inventory, items, or crafting — loot resolution is
 *    main.js's responsibility.
 *  - No Math.random() — all placement derives from hash2(worldSeed, ...).
 *  - Communicates outward exclusively through UIBus events.
 *
 * UIBus events emitted:
 *   'enemy:died'   { enemyId, lootTable, position }
 *   'enemy:aggro'  { enemyId, name }           (optional — for audio/minimap)
 */

// Interior padding so enemies don't spawn right at chunk edge seams
const EDGE_PAD = 2;

export class EnemySpawner {
  /**
   * @param {{ scene: object, worldSeed: number, biomeMap?: object, placementSource?: object, uiBus: object }} opts
   */
  constructor({ scene, worldSeed, biomeMap = null, placementSource = null, uiBus }) {
    this._scene = scene;
    this._worldSeed = worldSeed | 0;
    this._biomeMap = biomeMap;
    this._placementSource = placementSource;
    this._uiBus = uiBus;

    /** @type {Map<string, WanderingEnemy[]>} chunkKey → logic instances */
    this._enemiesByChunk = new Map();

    /** @type {Map<string, WanderingEnemyVisual[]>} chunkKey → visual instances */
    this._visualsByChunk = new Map();

    /** @type {Map<string, object>} enemyId → EnemyDefinition */
    this._defByEnemyId = new Map();

    // Bind so it can be passed as a callback without losing context
    this._handleDeath = this._handleDeath.bind(this);
  }

  // ── Chunk lifecycle ─────────────────────────────────────────────────────────

  /**
   * Spawn enemies for a freshly-loaded chunk.
   * Called by ChunkManager (or main.js) after a chunk is built.
   *
   * @param {number} chunkX
   * @param {number} chunkZ
   * @param {string} biomeId
   * @param {function(number, number): number} heightAt  — (worldX, worldZ) => y
   */
  spawnEnemiesForChunk(chunkX, chunkZ, biomeId, heightAt) {
    const key = `${chunkX},${chunkZ}`;
    if (this._enemiesByChunk.has(key)) return; // already spawned

    if (this._placementSource) {
      this._spawnAuthoredEnemiesForChunk(key, chunkX, chunkZ, heightAt);
      return;
    }

    const defs = getEnemiesForBiome(biomeId);
    if (defs.length === 0) {
      this._enemiesByChunk.set(key, []);
      this._visualsByChunk.set(key, []);
      return;
    }

    const originX = chunkX * CHUNK_SIZE;
    const originZ = chunkZ * CHUNK_SIZE;
    const inner = CHUNK_SIZE - EDGE_PAD * 2;

    const enemies = [];
    const visuals = [];
    const seed = this._worldSeed;

    let slotIndex = 0;

    for (const def of defs) {
      for (let i = 0; i < def.maxPerChunk; i += 1) {
        // Deterministic position — unique per (seed, chunkX, chunkZ, slotIndex)
        const hx = hash2(chunkX * 31 + slotIndex, chunkZ * 17, seed ^ 0x4e3d2c1b);
        const hz = hash2(chunkX * 13, chunkZ * 29 + slotIndex, seed ^ 0x9a8b7c6d);

        const spawnX = originX + EDGE_PAD + hx * inner;
        const spawnZ = originZ + EDGE_PAD + hz * inner;
        const spawnY = heightAt(spawnX, spawnZ) + 1.0;

        // Per-enemy PRNG seeded from position hash so wander patterns differ
        const enemySeed = hash2(chunkX * 97 + slotIndex, chunkZ * 53 + i, seed ^ 0xfe1dc0de);
        const rng = mulberry32(Math.floor(enemySeed * 0xffffffff));

        const enemyId = `${key}:${def.id}:${i}`;
        const enemy = new WanderingEnemy({
          id: enemyId,
          spawnX,
          spawnZ,
          rng,
          onDeath: this._handleDeath,
        });
        enemy.position.y = spawnY;
        enemy.aggroRange = def.aggroRange;
        enemy.attackRange = def.attackRange;
        enemy.ATTACK_DAMAGE = def.damage;
        enemy.hp = def.hp;
        enemy.maxHp = def.hp;

        const visual = new WanderingEnemyVisual({ scene: this._scene, enemy });

        this._defByEnemyId.set(enemyId, def);
        enemies.push(enemy);
        visuals.push(visual);

        slotIndex += 1;
      }
    }

    this._enemiesByChunk.set(key, enemies);
    this._visualsByChunk.set(key, visuals);
  }

  /**
   * Remove and dispose all enemies for an unloading chunk.
   * Called by ChunkManager before a chunk is removed.
   *
   * @param {number} chunkX
   * @param {number} chunkZ
   */
  despawnEnemiesForChunk(chunkX, chunkZ) {
    const key = `${chunkX},${chunkZ}`;
    const visuals = this._visualsByChunk.get(key);
    const enemies = this._enemiesByChunk.get(key);

    if (visuals) {
      for (const visual of visuals) {
        visual.dispose();
      }
      this._visualsByChunk.delete(key);
    }

    if (enemies) {
      for (const enemy of enemies) {
        this._defByEnemyId.delete(enemy.id);
      }
      this._enemiesByChunk.delete(key);
    }
  }

  // ── Per-frame update ────────────────────────────────────────────────────────

  /**
   * Advance all active enemies by dt seconds.
   *
   * @param {number} dt - delta time in seconds
   * @param {{ x: number, y: number, z: number } | null} playerPosition
   */
  update(dt, playerTarget) {
    const enemyTarget = normalizeEnemyTarget(playerTarget);

    for (const [key, enemies] of this._enemiesByChunk.entries()) {
      const visuals = this._visualsByChunk.get(key);

      for (let i = 0; i < enemies.length; i += 1) {
        const enemy = enemies[i];
        if (enemy.isDead) {
          if (visuals && visuals[i]) {
            visuals[i].update(dt);
          }
          continue;
        }

        enemy.update(dt, enemyTarget);
        if (visuals && visuals[i]) {
          visuals[i].update(dt);
        }
      }
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  /**
   * Total number of enemy slots currently loaded (includes dead but not yet
   * despawned enemies — despawn happens at chunk unload).
   *
   * @returns {number}
   */
  get activeEnemyCount() {
    let count = 0;
    for (const enemies of this._enemiesByChunk.values()) {
      count += enemies.length;
    }
    return count;
  }

  /**
   * Live, damage-capable enemies for player combat systems.
   * Dead enemies are omitted; loot/death side effects remain owned by each enemy.
   *
   * @returns {WanderingEnemy[]}
   */
  getCombatTargets() {
    const targets = [];

    for (const enemies of this._enemiesByChunk.values()) {
      for (const enemy of enemies) {
        if (!enemy.isDead) {
          targets.push(enemy);
        }
      }
    }

    return targets;
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  dispose() {
    for (const [key] of this._enemiesByChunk.entries()) {
      const [cx, cz] = key.split(',').map(Number);
      this.despawnEnemiesForChunk(cx, cz);
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  /**
   * Invoked by WanderingEnemy when it transitions to DEAD.
   * Emits 'enemy:died' on UIBus so main.js can resolve loot rolls.
   *
   * @param {{ enemy: WanderingEnemy }} param0
   */
  _handleDeath({ enemy }) {
    const def = this._defByEnemyId.get(enemy.id);
    this._uiBus.emit('enemy:died', {
      enemyId: enemy.id,
      enemyTypeId: def?.id ?? null,
      enemyName: def?.name ?? null,
      lootTable: def ? def.lootTable : [],
      position: { ...enemy.position },
    });
  }

  _spawnAuthoredEnemiesForChunk(key, chunkX, chunkZ, heightAt) {
    const placements = this._getAuthoredEnemyPlacements(chunkX, chunkZ);
    const enemies = [];
    const visuals = [];
    const seed = this._worldSeed;

    for (let index = 0; index < placements.length; index += 1) {
      const placement = placements[index];
      const def = getEnemyDefinitionForPlacementTags(placement.tags);
      if (!def) continue;

      const spawnX = placement.origin.x;
      const spawnZ = placement.origin.z;
      const spawnY = heightAt(spawnX, spawnZ) + 1.0;
      const enemySeed = hash2(
        Math.floor(spawnX * 97) + index,
        Math.floor(spawnZ * 53) + index,
        seed ^ 0xfe1dc0de
      );
      const rng = mulberry32(Math.floor(enemySeed * 0xffffffff));
      const enemyId = placement.id;
      const enemy = new WanderingEnemy({
        id: enemyId,
        spawnX,
        spawnZ,
        rng,
        onDeath: this._handleDeath,
      });
      enemy.position.y = spawnY;
      enemy.aggroRange = def.aggroRange;
      enemy.attackRange = def.attackRange;
      enemy.ATTACK_DAMAGE = def.damage;
      enemy.hp = def.hp;
      enemy.maxHp = def.hp;

      const visual = new WanderingEnemyVisual({ scene: this._scene, enemy });

      this._defByEnemyId.set(enemyId, def);
      enemies.push(enemy);
      visuals.push(visual);
    }

    this._enemiesByChunk.set(key, enemies);
    this._visualsByChunk.set(key, visuals);
  }

  _getAuthoredEnemyPlacements(chunkX, chunkZ) {
    if (typeof this._placementSource?.getEnemiesForChunk === "function") {
      return this._placementSource.getEnemiesForChunk(chunkX, chunkZ);
    }

    if (typeof this._placementSource?.getPlacementsForChunk === "function") {
      return this._placementSource
        .getPlacementsForChunk(chunkX, chunkZ)
        .filter((placement) => placement.type === "enemy");
    }

    return [];
  }
}

function normalizeEnemyTarget(playerTarget) {
  if (!playerTarget) return null;

  const position = playerTarget.position ?? playerTarget;
  const target = {
    x: position.x,
    y: position.y,
    z: position.z
  };

  if (typeof playerTarget.takeDamage === "function") {
    target.takeDamage = playerTarget.takeDamage.bind(playerTarget);
  }

  return target;
}
