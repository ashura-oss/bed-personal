import { describe, expect, it, jest } from "@jest/globals";
import { PrefabLoader } from "../world/prefab/PrefabLoader.js";

describe("PrefabLoader", () => {
  function createFakeRegistry() {
    let buildCount = 0;
    const anchor = {
      id: "hearthmere_camp",
      build: () => {
        buildCount += 1;
        return {
          id: "hearthmere_camp",
          hearthlights: [{ isPlayerNear: false }],
          updateCalls: 0,
          update(...args) {
            this.updateCalls += 1;
            this.lastUpdateArgs = args;
            this.hearthlights[0].isPlayerNear = true;
          },
          isPlayerNearInteractable() {
            return this.hearthlights[0].isPlayerNear;
          },
          dispose() {
            this.disposed = true;
          }
        };
      }
    };

    return {
      get buildCount() {
        return buildCount;
      },
      getAnchorById(id) {
        return id === anchor.id ? anchor : null;
      },
      getPrefabAnchors() {
        return [anchor];
      },
      getPlacementsOverlappingChunk() {
        return [anchor];
      }
    };
  }

  it("dedupes a prefab that overlaps multiple chunks", () => {
    const registry = createFakeRegistry();
    const loader = new PrefabLoader({}, null, registry);

    loader.ensureChunk(0, 0);
    loader.ensureChunk(1, 0);
    loader.ensureChunk(0, 1);

    expect(registry.buildCount).toBe(1);
    expect(loader.getInstance("hearthmere_camp").id).toBe("hearthmere_camp");
  });

  it("passes anchor and callbacks to prefab builds and fires lifecycle callbacks", () => {
    const instance = {
      id: "hearthmere_camp",
      dispose() {}
    };
    const anchor = {
      id: "hearthmere_camp",
      origin: { x: 1, y: 2, z: 3 },
      build: jest.fn(() => instance)
    };
    const registry = {
      getAnchorById(id) {
        return id === anchor.id ? anchor : null;
      },
      getPrefabAnchors() {
        return [anchor];
      },
      getPlacementsOverlappingChunk() {
        return [anchor];
      }
    };
    const callbacks = {
      onHearthlightRest: jest.fn(),
      onInstanceCreated: jest.fn(),
      onInstanceDisposed: jest.fn()
    };
    const scene = {};
    const rapier = {};
    const loader = new PrefabLoader(scene, rapier, registry, callbacks);

    expect(loader.build("hearthmere_camp")).toBe(instance);
    expect(anchor.build).toHaveBeenCalledWith({
      scene,
      rapier,
      origin: anchor.origin,
      anchor,
      callbacks
    });
    expect(callbacks.onInstanceCreated).toHaveBeenCalledTimes(1);
    expect(callbacks.onInstanceCreated).toHaveBeenCalledWith(instance, anchor);

    loader.dispose();

    expect(callbacks.onInstanceDisposed).toHaveBeenCalledTimes(1);
    expect(callbacks.onInstanceDisposed).toHaveBeenCalledWith(instance, anchor);
  });

  it("rejects malformed build returns before caching", () => {
    let buildResult = null;
    let buildCount = 0;
    const validInstance = {
      id: "bad_prefab",
      dispose() {}
    };
    const anchor = {
      id: "bad_prefab",
      build: () => {
        buildCount += 1;
        return buildResult;
      }
    };
    const registry = {
      getAnchorById(id) {
        return id === anchor.id ? anchor : null;
      },
      getPrefabAnchors() {
        return [anchor];
      },
      getPlacementsOverlappingChunk() {
        return [anchor];
      }
    };
    const loader = new PrefabLoader({}, null, registry);

    expect(() => loader.build("bad_prefab")).toThrow(TypeError);
    expect(loader.getInstance("bad_prefab")).toBeNull();

    buildResult = validInstance;

    expect(loader.build("bad_prefab")).toBe(validInstance);
    expect(buildCount).toBe(2);
  });

  it("rejects invalid prefab instance contracts", () => {
    const malformedInstances = [
      {},
      { dispose() {}, update: true },
      { dispose() {}, isPlayerNearInteractable: true },
      { dispose() {}, hearthlights: {} },
      { dispose() {}, bossArenas: {} }
    ];

    for (const instance of malformedInstances) {
      const anchor = {
        id: "malformed_prefab",
        build: () => instance
      };
      const registry = {
        getAnchorById() {
          return anchor;
        },
        getPrefabAnchors() {
          return [anchor];
        },
        getPlacementsOverlappingChunk() {
          return [anchor];
        }
      };
      const loader = new PrefabLoader({}, null, registry);

      expect(() => loader.build("malformed_prefab")).toThrow(TypeError);
      expect(loader.getInstance("malformed_prefab")).toBeNull();
    }
  });

  it("unloads chunk-owned prefabs only after their final overlapping chunk unloads", () => {
    const instance = {
      id: "hearthmere_camp",
      disposed: false,
      dispose() {
        this.disposed = true;
      }
    };
    const anchor = {
      id: "hearthmere_camp",
      build: () => instance
    };
    const registry = {
      getAnchorById(id) {
        return id === anchor.id ? anchor : null;
      },
      getPrefabAnchors() {
        return [anchor];
      },
      getPlacementsOverlappingChunk(cx, cz) {
        return (cz === 0 && (cx === 0 || cx === 1)) ? [anchor] : [];
      }
    };
    const loader = new PrefabLoader({}, null, registry);

    loader.ensureChunk(0, 0);
    loader.ensureChunk(1, 0);
    loader.unloadChunk(0, 0);

    expect(loader.getInstance("hearthmere_camp")).toBe(instance);
    expect(instance.disposed).toBe(false);

    loader.unloadChunk(1, 0);

    expect(instance.disposed).toBe(true);
    expect(loader.getInstance("hearthmere_camp")).toBeNull();
  });

  it("keeps directly built prefabs persistent across chunk unload cleanup", () => {
    const instance = {
      id: "hearthmere_camp",
      disposed: false,
      dispose() {
        this.disposed = true;
      }
    };
    const anchor = {
      id: "hearthmere_camp",
      build: () => instance
    };
    const registry = {
      getAnchorById(id) {
        return id === anchor.id ? anchor : null;
      },
      getPrefabAnchors() {
        return [anchor];
      },
      getPlacementsOverlappingChunk() {
        return [anchor];
      }
    };
    const loader = new PrefabLoader({}, null, registry);

    loader.build("hearthmere_camp");
    loader.ensureChunk(0, 0);
    loader.unloadChunk(0, 0);

    expect(loader.getInstance("hearthmere_camp")).toBe(instance);
    expect(instance.disposed).toBe(false);
  });

  it("updates instances and reports interactable proximity", () => {
    const registry = createFakeRegistry();
    const loader = new PrefabLoader({}, null, registry);
    loader.ensureChunk(0, 0);
    const playerPosition = { x: 0, y: 0, z: 0 };
    const runtime = { controlLocked: false };

    expect(loader.isPlayerNearInteractable()).toBe(false);
    loader.update(0.016, playerPosition, true, runtime);

    const instance = loader.getInstance("hearthmere_camp");
    expect(instance.updateCalls).toBe(1);
    expect(instance.lastUpdateArgs).toEqual([0.016, playerPosition, true, runtime]);
    expect(loader.isPlayerNearInteractable()).toBe(true);
  });

  it("enumerates built Hearthlights for map markers", () => {
    const instance = {
      id: "hearthmere_camp",
      hearthlights: [
        {
          group: {
            position: { x: 4, y: 1, z: 8 }
          }
        }
      ],
      dispose() {}
    };
    const anchor = {
      id: "hearthmere_camp",
      build: () => instance
    };
    const registry = {
      getAnchorById(id) {
        return id === anchor.id ? anchor : null;
      },
      getPrefabAnchors() {
        return [anchor];
      },
      getPlacementsOverlappingChunk() {
        return [anchor];
      }
    };
    const loader = new PrefabLoader({}, null, registry);

    expect(loader.getHearthlights()).toEqual([]);

    loader.ensureChunk(0, 0);

    expect(loader.getHearthlights()).toEqual([
      {
        id: "hearthmere_camp:hearthlight:0",
        instanceId: "hearthmere_camp",
        name: "Hearthmere Camp Hearthlight",
        hearthlight: instance.hearthlights[0],
        position: { x: 4, y: 1, z: 8 }
      }
    ]);
  });

  it("collects boss arenas and returns the active arena generically", () => {
    const inactiveArena = { active: false };
    const activeArena = { active: true };
    const instance = {
      id: "hearthmere_crypt",
      bossArenas: [inactiveArena, activeArena],
      dispose() {}
    };
    const anchor = {
      id: "hearthmere_crypt",
      build: () => instance
    };
    const registry = {
      getAnchorById(id) {
        return id === anchor.id ? anchor : null;
      },
      getPrefabAnchors() {
        return [anchor];
      },
      getPlacementsOverlappingChunk() {
        return [anchor];
      }
    };
    const loader = new PrefabLoader({}, null, registry);

    expect(loader.getBossArenas()).toEqual([]);
    expect(loader.getActiveBossArena()).toBeNull();

    loader.ensureChunk(0, 0);

    expect(loader.getBossArenas()).toEqual([inactiveArena, activeArena]);
    expect(loader.getActiveBossArena()).toBe(activeArena);
  });

  it("disposes all built instances", () => {
    const registry = createFakeRegistry();
    const loader = new PrefabLoader({}, null, registry);
    loader.ensureChunk(0, 0);
    const instance = loader.getInstance("hearthmere_camp");

    loader.dispose();

    expect(instance.disposed).toBe(true);
    expect(loader.getInstance("hearthmere_camp")).toBeNull();
  });
});
