import { describe, expect, it, jest } from "@jest/globals";
import { ChunkManager } from "../world/chunk/ChunkManager.js";
import { AuthoredMapSource } from "../world/authored/AuthoredMapSource.js";

function makeScene() {
  return {
    add: jest.fn(),
    remove: jest.fn()
  };
}

function makeRapier() {
  const body = {};

  return {
    module: {
      RigidBodyDesc: {
        fixed: () => ({
          setTranslation() {
            return this;
          }
        })
      },
      ColliderDesc: {
        trimesh: jest.fn(() => ({}))
      }
    },
    world: {
      createRigidBody: jest.fn(() => body),
      createCollider: jest.fn(),
      removeRigidBody: jest.fn()
    }
  };
}

describe("ChunkManager", () => {
  it("does not spawn streamed content for chunks outside authored region coverage", () => {
    const source = new AuthoredMapSource();
    const gatheringSystem = {
      spawnNodesForChunk: jest.fn(),
      despawnNodesForChunk: jest.fn()
    };
    const enemySpawner = {
      spawnEnemiesForChunk: jest.fn(),
      despawnEnemiesForChunk: jest.fn(),
      dispose: jest.fn()
    };
    const npcSpawner = {
      spawnNpcsForChunk: jest.fn(),
      despawnNpcsForChunk: jest.fn(),
      dispose: jest.fn()
    };
    const manager = new ChunkManager(makeScene(), makeRapier(), 1337, {
      biomeSource: source,
      heightSource: source,
      gatheringSystem,
      enemySpawner,
      npcSpawner
    });

    manager.buildChunk(79, 0);

    expect(gatheringSystem.spawnNodesForChunk).not.toHaveBeenCalled();
    expect(enemySpawner.spawnEnemiesForChunk).not.toHaveBeenCalled();
    expect(npcSpawner.spawnNpcsForChunk).not.toHaveBeenCalled();

    manager.dispose();
  });

  it("allows streamed content for chunks that partially overlap authored region coverage", () => {
    const source = new AuthoredMapSource();
    const gatheringSystem = {
      spawnNodesForChunk: jest.fn(),
      despawnNodesForChunk: jest.fn()
    };
    const enemySpawner = {
      spawnEnemiesForChunk: jest.fn(),
      despawnEnemiesForChunk: jest.fn(),
      dispose: jest.fn()
    };
    const npcSpawner = {
      spawnNpcsForChunk: jest.fn(),
      despawnNpcsForChunk: jest.fn(),
      dispose: jest.fn()
    };
    const manager = new ChunkManager(makeScene(), makeRapier(), 1337, {
      biomeSource: source,
      heightSource: source,
      gatheringSystem,
      enemySpawner,
      npcSpawner
    });

    manager.buildChunk(78, 0);

    expect(gatheringSystem.spawnNodesForChunk).toHaveBeenCalledWith(
      78,
      0,
      "hearthmere",
      expect.any(Function)
    );
    expect(enemySpawner.spawnEnemiesForChunk).toHaveBeenCalledWith(
      78,
      0,
      "hearthmere",
      expect.any(Function)
    );
    expect(npcSpawner.spawnNpcsForChunk).toHaveBeenCalledWith(78, 0);

    manager.dispose();
  });

  it("notifies the prefab loader when evicting chunks", () => {
    const prefabLoader = {
      ensureChunk: jest.fn(),
      unloadChunk: jest.fn()
    };
    const manager = new ChunkManager(makeScene(), makeRapier(), 1337, {
      prefabLoader
    });

    manager.buildChunk(0, 0);
    manager.unloadFar(100, 100);

    expect(prefabLoader.ensureChunk).toHaveBeenCalledWith(0, 0);
    expect(prefabLoader.unloadChunk).toHaveBeenCalledWith(0, 0);
    expect(manager.loaded.size).toBe(0);

    manager.dispose();
  });

  it("samples runtime atmosphere from authoritative zones while keeping terrain biome blends", () => {
    const source = new AuthoredMapSource();
    const manager = new ChunkManager(makeScene(), makeRapier(), 1337, {
      biomeSource: source,
      heightSource: source
    });

    const terrainBiome = manager.sampleBiome(625, 1500);
    const atmosphereBiome = manager.sampleAtmosphereBiome(625, 1500);

    expect(terrainBiome._maskWeights["hearthmere.ashfall_road"]).toBeGreaterThan(0);
    expect(terrainBiome._maskWeights["hearthmere.fen"]).toBeGreaterThan(0);
    expect(atmosphereBiome._zoneId).toBe("hearthmere.fen");
    expect(atmosphereBiome.fogDensity).toBeCloseTo(0.055);

    manager.dispose();
  });
});
