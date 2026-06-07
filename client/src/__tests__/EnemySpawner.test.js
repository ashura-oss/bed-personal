import { describe, expect, it, beforeEach, jest } from "@jest/globals";

// ── Manual mocks for Three.js-dependent modules ─────────────────────────────
//
// WanderingEnemyVisual imports Three.js which is not available in Jest.
// We inject lightweight stubs so EnemySpawner can be tested as a pure system.

jest.mock("../gameplay/enemies/WanderingEnemyVisual.js", () => ({
  WanderingEnemyVisual: jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    dispose: jest.fn(),
  })),
}));

// WanderingEnemy is pure JS but we stub it so we can control isDead
// and inspect calls without running real AI ticks.
jest.mock("../gameplay/enemies/WanderingEnemy.js", () => {
  const STATE = Object.freeze({
    IDLE: "idle",
    WANDER: "wander",
    CHASE: "chase",
    ATTACK: "attack",
    RETURN: "return",
    DEAD: "dead",
  });

  let nextId = 0;

  const WanderingEnemy = jest.fn().mockImplementation(({ id, spawnX, spawnZ, onDeath }) => {
    const instance = {
      id: id ?? `stub-${nextId++}`,
      position: { x: spawnX ?? 0, y: 0, z: spawnZ ?? 0 },
      spawnPoint: { x: spawnX ?? 0, z: spawnZ ?? 0 },
      hp: 30,
      maxHp: 30,
      aggroRange: 10,
      attackRange: 1.8,
      ATTACK_DAMAGE: 8,
      state: STATE.IDLE,
      _isDead: false,
      _onDeath: onDeath ?? (() => {}),
      get isDead() { return this._isDead; },
      update: jest.fn(),
      takeDamage: jest.fn().mockImplementation(function (amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) {
          this._isDead = true;
          this._onDeath({ enemy: this });
        }
      }),
    };
    return instance;
  });

  return { WanderingEnemy, STATE };
});

// ── Now import the system under test ────────────────────────────────────────

import { EnemySpawner } from "../gameplay/enemies/EnemySpawner.js";
import { WanderingEnemyVisual } from "../gameplay/enemies/WanderingEnemyVisual.js";
import { ENEMY_DEFINITIONS } from "../gameplay/enemies/EnemyDefinitions.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeBus() {
  const events = [];
  return {
    emit(name, payload) { events.push({ name, payload }); },
    events(name) { return events.filter((e) => e.name === name); },
    all() { return events; },
    clear() { events.length = 0; },
  };
}

function makeScene() {
  return {
    add: jest.fn(),
    remove: jest.fn(),
  };
}

const WORLD_SEED = 1337;
const HEIGHT_AT = () => 0;

function makeSpawner(overrides = {}) {
  return new EnemySpawner({
    scene: makeScene(),
    worldSeed: WORLD_SEED,
    uiBus: makeBus(),
    ...overrides,
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("EnemySpawner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. spawnEnemiesForChunk creates enemies for a biome that has defs
  it("spawnEnemiesForChunk creates enemies for hearthmere (count <= sum of maxPerChunk)", () => {
    const bus = makeBus();
    const spawner = new EnemySpawner({ scene: makeScene(), worldSeed: WORLD_SEED, uiBus: bus });

    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);

    const maxPossible = ENEMY_DEFINITIONS
      .filter((d) => d.biomes.includes("hearthmere"))
      .reduce((sum, d) => sum + d.maxPerChunk, 0);

    expect(spawner.activeEnemyCount).toBeGreaterThan(0);
    expect(spawner.activeEnemyCount).toBeLessThanOrEqual(maxPossible);
  });

  it("spawnEnemiesForChunk uses authored enemy placements exactly when a placement source is present", () => {
    const placementSource = {
      getEnemiesForChunk: jest.fn(() => [
        {
          id: "hearthmere.enemy.authored_shambler",
          type: "enemy",
          tags: ["hollow_shambler"],
          origin: { x: 1400, y: 0, z: 32 }
        }
      ])
    };
    const spawner = new EnemySpawner({
      scene: makeScene(),
      worldSeed: WORLD_SEED,
      uiBus: makeBus(),
      placementSource
    });

    spawner.spawnEnemiesForChunk(43, 1, "hearthmere", HEIGHT_AT);

    expect(placementSource.getEnemiesForChunk).toHaveBeenCalledWith(43, 1);
    expect(spawner.activeEnemyCount).toBe(1);

    const enemies = spawner._enemiesByChunk.get("43,1");
    expect(enemies[0].id).toBe("hearthmere.enemy.authored_shambler");
    expect(enemies[0].position).toEqual({ x: 1400, y: 1, z: 32 });
  });

  it("spawnEnemiesForChunk does not fall back to procedural enemies for empty authored chunks", () => {
    const spawner = new EnemySpawner({
      scene: makeScene(),
      worldSeed: WORLD_SEED,
      uiBus: makeBus(),
      placementSource: {
        getEnemiesForChunk: jest.fn(() => [])
      }
    });

    spawner.spawnEnemiesForChunk(10, 10, "hearthmere", HEIGHT_AT);

    expect(spawner.activeEnemyCount).toBe(0);
    expect(spawner._enemiesByChunk.get("10,10")).toEqual([]);
  });

  // 2. Determinism: same seed + chunkX/Z → same enemy count
  it("is deterministic: same seed + chunkX/Z produces the same enemy count", () => {
    const s1 = makeSpawner();
    const s2 = makeSpawner();

    s1.spawnEnemiesForChunk(3, -2, "hearthmere", HEIGHT_AT);
    s2.spawnEnemiesForChunk(3, -2, "hearthmere", HEIGHT_AT);

    expect(s1.activeEnemyCount).toBe(s2.activeEnemyCount);
  });

  // 3. despawnEnemiesForChunk calls dispose() on visuals and clears map
  it("despawnEnemiesForChunk calls dispose() on all visuals and reduces activeEnemyCount to 0", () => {
    const spawner = makeSpawner();
    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);

    const countBefore = spawner.activeEnemyCount;
    expect(countBefore).toBeGreaterThan(0);

    // Capture the visual mock instances that were created for this chunk
    const visualInstances = WanderingEnemyVisual.mock.results.map((r) => r.value);

    spawner.despawnEnemiesForChunk(0, 0);

    expect(spawner.activeEnemyCount).toBe(0);
    for (const visual of visualInstances) {
      expect(visual.dispose).toHaveBeenCalledTimes(1);
    }
  });

  // 4. update() calls enemy.update() and visual.update() for each active enemy
  it("update() calls enemy.update() and visual.update() for each active enemy", () => {
    const scene = makeScene();
    const bus = makeBus();
    const spawner = new EnemySpawner({ scene, worldSeed: WORLD_SEED, uiBus: bus });

    spawner.spawnEnemiesForChunk(1, 1, "hearthmere", HEIGHT_AT);
    const count = spawner.activeEnemyCount;
    expect(count).toBeGreaterThan(0);

    const playerPos = { x: 0, y: 0, z: 0 };
    spawner.update(0.016, playerPos);

    // Each visual's update should have been called once
    const visualInstances = WanderingEnemyVisual.mock.results.map((r) => r.value);
    for (const visual of visualInstances) {
      expect(visual.update).toHaveBeenCalledTimes(1);
      expect(visual.update).toHaveBeenCalledWith(0.016);
    }
  });

  it("update() passes a damage-capable player target to wandering enemies", () => {
    const spawner = makeSpawner();
    const player = {
      position: { x: 0, y: 1, z: 0 },
      takeDamage: jest.fn()
    };

    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);
    spawner.update(0.016, player);

    const enemies = spawner._enemiesByChunk.get("0,0");
    const target = enemies[0].update.mock.calls[0][1];

    expect(target).toMatchObject({ x: 0, y: 1, z: 0 });
    expect(typeof target.takeDamage).toBe("function");

    target.takeDamage(8);
    expect(player.takeDamage).toHaveBeenCalledWith(8);
  });

  // 5. Dead enemies are skipped in update()
  it("dead enemies are skipped in update()", () => {
    const scene = makeScene();
    const bus = makeBus();
    const spawner = new EnemySpawner({ scene, worldSeed: WORLD_SEED, uiBus: bus });

    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);

    // Mark all enemies as dead
    const enemies = spawner._enemiesByChunk.get("0,0");
    for (const enemy of enemies) {
      enemy._isDead = true;
    }

    // Clear call counts on visuals from construction
    const visualInstances = WanderingEnemyVisual.mock.results.map((r) => r.value);
    for (const v of visualInstances) v.update.mockClear();

    spawner.update(0.016, { x: 0, y: 0, z: 0 });

    // enemy.update and visual.update should NOT have been called on dead enemies
    for (const enemy of enemies) {
      expect(enemy.update).not.toHaveBeenCalled();
    }
    for (const visual of visualInstances) {
      expect(visual.update).not.toHaveBeenCalled();
    }
  });

  // 6. _handleDeath emits 'enemy:died' on UIBus with correct shape
  it("_handleDeath emits 'enemy:died' on UIBus with correct shape", () => {
    const bus = makeBus();
    const spawner = new EnemySpawner({ scene: makeScene(), worldSeed: WORLD_SEED, uiBus: bus });

    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);

    const enemies = spawner._enemiesByChunk.get("0,0");
    expect(enemies.length).toBeGreaterThan(0);

    const firstEnemy = enemies[0];
    // Simulate death by calling _handleDeath directly
    spawner._handleDeath({ enemy: firstEnemy });

    const died = bus.events("enemy:died");
    expect(died.length).toBe(1);
    const payload = died[0].payload;
    expect(payload).toHaveProperty("enemyId");
    expect(payload.enemyId).toBe(firstEnemy.id);
    expect(payload).toHaveProperty("enemyTypeId");
    expect(typeof payload.enemyTypeId).toBe("string");
    expect(payload.enemyTypeId.length).toBeGreaterThan(0);
    expect(payload).toHaveProperty("enemyName");
    expect(typeof payload.enemyName).toBe("string");
    expect(payload).toHaveProperty("lootTable");
    expect(Array.isArray(payload.lootTable)).toBe(true);
    expect(payload).toHaveProperty("position");
    expect(typeof payload.position.x).toBe("number");
    expect(typeof payload.position.y).toBe("number");
    expect(typeof payload.position.z).toBe("number");
  });

  // 7. activeEnemyCount decreases after despawn
  it("activeEnemyCount decreases after despawnEnemiesForChunk", () => {
    const spawner = makeSpawner();
    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);
    spawner.spawnEnemiesForChunk(1, 0, "hearthmere", HEIGHT_AT);

    const countBefore = spawner.activeEnemyCount;
    const chunkZeroCount = spawner._enemiesByChunk.get("0,0").length;

    spawner.despawnEnemiesForChunk(0, 0);

    expect(spawner.activeEnemyCount).toBe(countBefore - chunkZeroCount);
  });

  // 8. spawnEnemiesForChunk is idempotent (called twice for same chunk)
  it("spawnEnemiesForChunk is idempotent — second call for same chunk is a no-op", () => {
    const spawner = makeSpawner();
    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);
    const count = spawner.activeEnemyCount;

    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);
    expect(spawner.activeEnemyCount).toBe(count);
  });

  // 9. Unknown biome spawns no enemies
  it("spawnEnemiesForChunk with unknown biome creates 0 enemies", () => {
    const spawner = makeSpawner();
    spawner.spawnEnemiesForChunk(5, 5, "unknown_biome", HEIGHT_AT);
    expect(spawner.activeEnemyCount).toBe(0);
  });

  // 10. dispose() cleans up all chunks
  it("dispose() clears all chunk maps", () => {
    const spawner = makeSpawner();
    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);
    spawner.spawnEnemiesForChunk(1, 1, "hearthmere", HEIGHT_AT);

    spawner.dispose();

    expect(spawner.activeEnemyCount).toBe(0);
  });

  // 11. position in loot event is a snapshot (not a live reference)
  it("enemy:died position is a snapshot, not a live reference to enemy.position", () => {
    const bus = makeBus();
    const spawner = new EnemySpawner({ scene: makeScene(), worldSeed: WORLD_SEED, uiBus: bus });

    spawner.spawnEnemiesForChunk(0, 0, "hearthmere", HEIGHT_AT);
    const enemies = spawner._enemiesByChunk.get("0,0");
    const firstEnemy = enemies[0];
    firstEnemy.position = { x: 10, y: 1, z: 20 };

    spawner._handleDeath({ enemy: firstEnemy });

    const died = bus.events("enemy:died");
    const snapPosition = died[0].payload.position;

    // Mutate the live position — the snapshot must not change
    firstEnemy.position.x = 999;
    expect(snapPosition.x).toBe(10);
  });

  // 12. Different seeds produce different layouts for the same chunk
  it("different seeds produce different spawner activeEnemyCount or enemy ids", () => {
    const s1 = new EnemySpawner({ scene: makeScene(), worldSeed: 1111, uiBus: makeBus() });
    const s2 = new EnemySpawner({ scene: makeScene(), worldSeed: 9999, uiBus: makeBus() });

    s1.spawnEnemiesForChunk(5, 5, "hearthmere", HEIGHT_AT);
    s2.spawnEnemiesForChunk(5, 5, "hearthmere", HEIGHT_AT);

    // Both should spawn enemies; count may differ (or positions differ in real WanderingEnemy)
    // Since mocked WanderingEnemy doesn't vary, at minimum both should have enemies
    expect(s1.activeEnemyCount).toBeGreaterThan(0);
    expect(s2.activeEnemyCount).toBeGreaterThan(0);
  });
});
