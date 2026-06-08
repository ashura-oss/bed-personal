import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { Action } from "../controls/InputMap.js";
import { GatheringSystem } from "../gameplay/gathering/GatheringSystem.js";
import { RESOURCE_DEFINITIONS } from "../world/resources/ResourceDefinitions.js";

class StubNode {
  constructor(definition, worldX = 0, worldZ = 0) {
    this._def = definition;
    this._hits = definition.hitPoints;
    this._depleted = false;
    this._id = StubNode._nextId;
    StubNode._nextId += 1;
    this.position = { x: worldX, y: 0, z: worldZ };
  }
  harvest() {
    if (this._depleted) return null;
    this._hits -= 1;
    if (this._hits <= 0) { this._hits = 0; this._depleted = true; }
    return { itemId: this._def.yield.itemId, count: this._def.yield.count };
  }
  respawn() { this._hits = this._def.hitPoints; this._depleted = false; }
  get id() { return this._id; }
  get isDepleted() { return this._depleted; }
  get definition() { return this._def; }
}
StubNode._nextId = 1;

describe("ResourceNode harvest state machine (stub)", () => {
  const woodDef = { id: "wood", hitPoints: 3, yield: { itemId: "timber", count: 2 } };
  const herbDef = { id: "herb", hitPoints: 1, yield: { itemId: "ashleaf", count: 3 } };

  it("harvest() on a fresh node returns { itemId, count }", () => {
    const node = new StubNode(woodDef);
    const result = node.harvest();
    expect(result).toEqual({ itemId: "timber", count: 2 });
    expect(node.isDepleted).toBe(false);
  });

  it("harvest() depletes after hitPoints hits", () => {
    const node = new StubNode(woodDef);
    node.harvest(); node.harvest();
    const last = node.harvest();
    expect(last).toEqual({ itemId: "timber", count: 2 });
    expect(node.isDepleted).toBe(true);
  });

  it("harvest() past hitPoints returns null (depleted)", () => {
    const node = new StubNode(herbDef);
    node.harvest();
    const result = node.harvest();
    expect(result).toBeNull();
  });

  it("double-tap harvest on depleted returns null", () => {
    const node = new StubNode(woodDef);
    for (let i = 0; i < woodDef.hitPoints; i += 1) node.harvest();
    expect(node.harvest()).toBeNull();
    expect(node.harvest()).toBeNull();
  });

  it("respawn() resets a depleted node", () => {
    const node = new StubNode(herbDef);
    node.harvest();
    expect(node.isDepleted).toBe(true);
    node.respawn();
    expect(node.isDepleted).toBe(false);
    const result = node.harvest();
    expect(result).toEqual({ itemId: "ashleaf", count: 3 });
  });

  it("respawn() restores full hitPoints", () => {
    const node = new StubNode(woodDef);
    node.harvest(); node.harvest(); node.respawn();
    for (let i = 0; i < woodDef.hitPoints; i += 1) {
      expect(node.isDepleted).toBe(false); node.harvest();
    }
    expect(node.isDepleted).toBe(true);
  });
});

class TestableGatheringSystem {
  constructor(uiBus) { this._uiBus = uiBus; this._nodes = []; this._nearbyNodeId = null; }
  injectNodes(nodes) { this._nodes = nodes; }
  update(playerPosition, playerFacing, inputMap) {
    const px = playerPosition.x; const pz = playerPosition.z;
    const r2 = 9; let closest = null; let closestDist2 = Infinity;
    for (const node of this._nodes) {
      const { x: nx, z: nz } = node.position;
      const dx = nx - px; const dz = nz - pz;
      const dist2 = dx * dx + dz * dz;
      if (dist2 > r2) continue;
      const len = Math.sqrt(dist2) || 1;
      const dot = (dx / len) * playerFacing.x + (dz / len) * playerFacing.z;
      if (dot < 0.0) continue;
      if (dist2 < closestDist2) { closestDist2 = dist2; closest = node; }
    }
    const newNearbyId = closest ? closest.id : null;
    if (newNearbyId !== this._nearbyNodeId) {
      if (this._nearbyNodeId !== null) {
        this._uiBus.emit("gathering:node_left", { nodeId: this._nearbyNodeId });
      }
      if (closest !== null) {
        this._uiBus.emit("gathering:node_nearby", { nodeId: closest.id, definition: closest.definition });
      }
      this._nearbyNodeId = newNearbyId;
    }
    if (closest && inputMap.isJustPressed()) {
      const result = closest.harvest();
      if (result) {
        this._uiBus.emit("gathering:harvested", { itemId: result.itemId, count: result.count, nodeDef: closest.definition });
      }
      if (closest.isDepleted) {
        this._uiBus.emit("gathering:depleted", { nodeId: closest.id });
      }
    }
  }
  respawnAll() { for (const node of this._nodes) { if (node.isDepleted) node.respawn(); } }
}

class MockUIBus {
  constructor() { this._events = []; }
  emit(name, payload) { this._events.push({ name, payload }); }
  events(name) { return this._events.filter((e) => e.name === name); }
  clear() { this._events = []; }
}

const facingForward = { x: 0, y: 0, z: 1 };
const interactInput = { isJustPressed: () => true };
const noInput = { isJustPressed: () => false };

describe("GatheringSystem proximity and event logic", () => {
  let bus; let gs;
  const woodDef = { id: "wood", hitPoints: 2, yield: { itemId: "timber", count: 2 } };
  beforeEach(() => { bus = new MockUIBus(); gs = new TestableGatheringSystem(bus); });

  it("emits gathering:node_nearby when player enters range", () => {
    const node = new StubNode(woodDef, 0, 2);
    gs.injectNodes([node]);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, noInput);
    const nearby = bus.events("gathering:node_nearby");
    expect(nearby.length).toBe(1);
    expect(nearby[0].payload.nodeId).toBe(node.id);
  });

  it("emits gathering:node_left when player moves away", () => {
    const node = new StubNode(woodDef, 0, 2);
    gs.injectNodes([node]);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, noInput);
    bus.clear();
    gs.update({ x: 0, y: 0, z: 10 }, facingForward, noInput);
    const left = bus.events("gathering:node_left");
    expect(left.length).toBe(1);
  });

  it("emits gathering:harvested when interact is pressed near a node", () => {
    const node = new StubNode(woodDef, 0, 2);
    gs.injectNodes([node]);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interactInput);
    const harvested = bus.events("gathering:harvested");
    expect(harvested.length).toBe(1);
    expect(harvested[0].payload.itemId).toBe("timber");
    expect(harvested[0].payload.count).toBe(2);
  });

  it("emits gathering:depleted when node runs out of hits", () => {
    const singleHitDef = { id: "herb", hitPoints: 1, yield: { itemId: "ashleaf", count: 3 } };
    const node = new StubNode(singleHitDef, 0, 2);
    gs.injectNodes([node]);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interactInput);
    const depleted = bus.events("gathering:depleted");
    expect(depleted.length).toBe(1);
    expect(depleted[0].payload.nodeId).toBe(node.id);
  });

  it("does not emit harvested if no interact input", () => {
    const node = new StubNode(woodDef, 0, 2);
    gs.injectNodes([node]);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, noInput);
    expect(bus.events("gathering:harvested").length).toBe(0);
  });

  it("respawnAll resets all depleted nodes", () => {
    const herbDef2 = { id: "herb", hitPoints: 1, yield: { itemId: "ashleaf", count: 3 } };
    const node = new StubNode(herbDef2);
    gs.injectNodes([node]);
    node.harvest();
    expect(node.isDepleted).toBe(true);
    gs.respawnAll();
    expect(node.isDepleted).toBe(false);
  });

  it("does not emit harvested if no node is within range", () => {
    const node = new StubNode(woodDef, 100, 100);
    gs.injectNodes([node]);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interactInput);
    expect(bus.events("gathering:harvested").length).toBe(0);
  });
});

function createFakeScene() {
  return {
    added: [],
    removed: [],
    add(object) {
      this.added.push(object);
    },
    remove(object) {
      this.removed.push(object);
    }
  };
}

function createFakeRapier() {
  const rapier = {
    createdBodies: [],
    removedBodies: [],
    module: {
      RigidBodyDesc: {
        fixed: () => ({
          translation: null,
          setTranslation(x, y, z) {
            this.translation = { x, y, z };
            return this;
          }
        })
      },
      ColliderDesc: {
        cuboid: (x, y, z) => ({ halfExtents: { x, y, z } })
      }
    },
    world: {
      createRigidBody(desc) {
        const body = { desc };
        rapier.createdBodies.push(body);
        return body;
      },
      createCollider(desc, body) {
        return {
          desc,
          body,
          sensor: false,
          setSensor(value) {
            this.sensor = value;
          }
        };
      },
      removeRigidBody(body) {
        rapier.removedBodies.push(body);
      }
    }
  };

  return rapier;
}

describe("GatheringSystem real ResourceNode integration", () => {
  it("spawns chunk nodes once, harvests through UIBus, and despawns cleanly", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const woodDef = RESOURCE_DEFINITIONS.find((def) => def.id === "wood");
    const scatter = {
      getNodesForChunk: () => [
        { worldX: 0, worldZ: 2, definition: woodDef }
      ]
    };
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: scatter,
      uiBus: bus
    });
    const heightAt = () => 0;

    gs.spawnNodesForChunk(0, 0, "hearthmere", heightAt);
    gs.spawnNodesForChunk(0, 0, "hearthmere", heightAt);

    expect(scene.added.length).toBe(1);
    expect(rapier.createdBodies.length).toBe(1);
    expect(gs.hasInteractable({ x: 0, y: 0, z: 0 }, facingForward)).toBe(true);
    expect(gs.hasInteractable({ x: 0, y: 0, z: 10 }, facingForward)).toBe(false);

    gs.update(
      { x: 0, y: 0, z: 0 },
      facingForward,
      { isJustPressed: (action) => action === Action.Interact }
    );

    const harvested = bus.events("gathering:harvested");
    expect(harvested.length).toBe(1);
    expect(harvested[0].payload.itemId).toBe("timber");

    gs.despawnNodesForChunk(0, 0);

    expect(scene.removed.length).toBe(1);
    expect(rapier.removedBodies.length).toBe(1);
  });

  it("uses authored resource placements instead of procedural scatter when a placement source is present", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const scatter = {
      getNodesForChunk: jest.fn(() => [
        { worldX: 99, worldZ: 99, definition: RESOURCE_DEFINITIONS.find((def) => def.id === "ore") }
      ])
    };
    const placementSource = {
      getResourcesForChunk: jest.fn(() => [
        {
          id: "hearthmere.res.test_timber",
          type: "resource",
          tags: ["timber"],
          origin: { x: 0, y: 0, z: 2 }
        }
      ])
    };
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: scatter,
      placementSource,
      uiBus: bus
    });

    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);

    expect(scatter.getNodesForChunk).not.toHaveBeenCalled();
    expect(placementSource.getResourcesForChunk).toHaveBeenCalledWith(0, 0);
    expect(scene.added.length).toBe(1);

    gs.update(
      { x: 0, y: 0, z: 0 },
      facingForward,
      { isJustPressed: (action) => action === Action.Interact }
    );

    const harvested = bus.events("gathering:harvested");
    expect(harvested.length).toBe(1);
    expect(harvested[0].payload.itemId).toBe("timber");
  });

  it("does not retarget depleted nodes or emit duplicate depleted events", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const herbDef = RESOURCE_DEFINITIONS.find((def) => def.id === "herb");
    const scatter = {
      getNodesForChunk: () => [
        { worldX: 0, worldZ: 2, definition: herbDef }
      ]
    };
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: scatter,
      uiBus: bus
    });
    const interact = { isJustPressed: (action) => action === Action.Interact };

    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);

    expect(bus.events("gathering:harvested").length).toBe(1);
    expect(gs.hasInteractable({ x: 0, y: 0, z: 0 }, facingForward)).toBe(false);
    const depleted = bus.events("gathering:depleted");
    expect(depleted.length).toBe(1);
    expect(depleted[0].payload.depletionKey).toBe("0,0:0:herb:0:2");
    expect(bus.events("gathering:node_left").length).toBe(1);
  });

  it("does not harvest or persist depletion when harvest acceptance is rejected", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const herbDef = RESOURCE_DEFINITIONS.find((def) => def.id === "herb");
    const canAcceptHarvest = jest.fn(() => false);
    const scatter = {
      getNodesForChunk: () => [
        { worldX: 0, worldZ: 2, definition: herbDef }
      ]
    };
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: scatter,
      canAcceptHarvest,
      uiBus: bus
    });
    const interact = { isJustPressed: (action) => action === Action.Interact };

    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);

    expect(canAcceptHarvest).toHaveBeenCalledWith({
      nodeId: expect.any(Number),
      itemId: "ashleaf",
      count: 3,
      nodeDef: herbDef
    });
    expect(bus.events("gathering:harvested").length).toBe(0);
    expect(bus.events("gathering:depleted").length).toBe(0);
    expect(gs.serializeDepletionSnapshot()).toEqual({
      version: 1,
      depletedKeys: []
    });

    canAcceptHarvest.mockReturnValue(true);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);

    expect(bus.events("gathering:harvested").length).toBe(1);
    expect(bus.events("gathering:depleted").length).toBe(1);
  });

  it("ignores malformed resource yields before acceptance or harvest mutation", () => {
    const baseMalformedDefinition = {
      meshType: "box",
      meshColor: 0xffffff
    };
    const malformedDefs = [
      { ...baseMalformedDefinition, id: "broken_missing_yield", hitPoints: 1 },
      { ...baseMalformedDefinition, id: "broken_missing_item", hitPoints: 1, yield: { count: 1 } },
      { ...baseMalformedDefinition, id: "broken_missing_count", hitPoints: 1, yield: { itemId: "ashleaf" } },
      { ...baseMalformedDefinition, id: "broken_zero_count", hitPoints: 1, yield: { itemId: "ashleaf", count: 0 } }
    ];

    for (const definition of malformedDefs) {
      const scene = createFakeScene();
      const rapier = createFakeRapier();
      const bus = new MockUIBus();
      const canAcceptHarvest = jest.fn(() => true);
      const gs = new GatheringSystem({
        scene,
        rapier,
        resourceScatter: {
          getNodesForChunk: () => [
            { worldX: 0, worldZ: 2, definition }
          ]
        },
        canAcceptHarvest,
        uiBus: bus
      });
      const interact = { isJustPressed: (action) => action === Action.Interact };

      gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);
      expect(() => {
        gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);
      }).not.toThrow();

      expect(canAcceptHarvest).not.toHaveBeenCalled();
      expect(bus.events("gathering:harvested").length).toBe(0);
      expect(bus.events("gathering:depleted").length).toBe(0);
      expect(gs.serializeDepletionSnapshot()).toEqual({
        version: 1,
        depletedKeys: []
      });
    }
  });

  it("does not harvest or persist depletion when harvest acceptance throws", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const herbDef = RESOURCE_DEFINITIONS.find((def) => def.id === "herb");
    const canAcceptHarvest = jest.fn(() => {
      throw new Error("inventory capacity check failed");
    });
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: {
        getNodesForChunk: () => [
          { worldX: 0, worldZ: 2, definition: herbDef }
        ]
      },
      canAcceptHarvest,
      uiBus: bus
    });
    const interact = { isJustPressed: (action) => action === Action.Interact };

    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);
    expect(() => {
      gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);
    }).not.toThrow();

    expect(canAcceptHarvest).toHaveBeenCalled();
    expect(bus.events("gathering:harvested").length).toBe(0);
    expect(bus.events("gathering:depleted").length).toBe(0);
    expect(gs.serializeDepletionSnapshot()).toEqual({
      version: 1,
      depletedKeys: []
    });
  });

  it("serializes depleted keys deterministically", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: { getNodesForChunk: () => [] },
      uiBus: bus
    });

    gs.restoreDepletionSnapshot({
      version: 1,
      depletedKeys: [
        "1,0:0:herb:4:5",
        "0,0:0:wood:0:2",
        "0,0:0:wood:0:2",
        "hearthmere.res.test_herb:herb:2:3"
      ]
    });

    expect(gs.serializeDepletionSnapshot()).toEqual({
      version: 1,
      depletedKeys: [
        "0,0:0:wood:0:2",
        "1,0:0:herb:4:5",
        "hearthmere.res.test_herb:herb:2:3"
      ]
    });
  });

  it("restores depletion before spawn and keeps matching nodes non-interactable", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const scatter = {
      getNodesForChunk: jest.fn(() => [])
    };
    const placementSource = {
      getResourcesForChunk: jest.fn(() => [
        {
          id: "hearthmere.res.restored_herb",
          type: "resource",
          tags: ["ashleaf"],
          origin: { x: 0, y: 0, z: 2 }
        },
        {
          id: "hearthmere.res.fresh_herb",
          type: "resource",
          tags: ["ashleaf"],
          origin: { x: 0, y: 0, z: 5 }
        }
      ])
    };
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: scatter,
      placementSource,
      uiBus: bus
    });

    gs.restoreDepletionSnapshot({
      version: 1,
      depletedKeys: ["hearthmere.res.restored_herb:herb:0:2"]
    });
    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);

    expect(scene.added.length).toBe(2);

    gs.update({ x: 0, y: 0, z: 0 }, facingForward, noInput);
    gs.update(
      { x: 0, y: 0, z: 0 },
      facingForward,
      { isJustPressed: (action) => action === Action.Interact }
    );

    expect(bus.events("gathering:node_nearby").length).toBe(0);
    expect(bus.events("gathering:harvested").length).toBe(0);
    expect(bus.events("gathering:depleted").length).toBe(0);
  });

  it("tolerates malformed depletion snapshots", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: { getNodesForChunk: () => [] },
      uiBus: bus
    });

    expect(() => gs.restoreDepletionSnapshot(null)).not.toThrow();
    expect(() => gs.restoreDepletionSnapshot({ depletedKeys: "not-an-array" })).not.toThrow();
    expect(() => gs.restoreDepletionSnapshot({ depletedKeys: [null, "", "  valid:key  ", 12] })).not.toThrow();

    expect(gs.serializeDepletionSnapshot()).toEqual({
      version: 1,
      depletedKeys: ["valid:key"]
    });
  });

  it("restores RunState-style depletedNodes snapshots", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: { getNodesForChunk: () => [] },
      uiBus: bus
    });

    gs.restoreDepletionSnapshot({
      depletedNodes: ["  runstate:key  "]
    });

    expect(gs.serializeDepletionSnapshot()).toEqual({
      version: 1,
      depletedKeys: ["runstate:key"]
    });
  });

  it("keeps depleted chunk nodes depleted across unload and reload", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const herbDef = RESOURCE_DEFINITIONS.find((def) => def.id === "herb");
    const scatter = {
      getNodesForChunk: () => [
        { worldX: 0, worldZ: 2, definition: herbDef }
      ]
    };
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: scatter,
      uiBus: bus
    });
    const interact = { isJustPressed: (action) => action === Action.Interact };

    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);

    expect(bus.events("gathering:depleted").length).toBe(1);

    bus.clear();
    gs.despawnNodesForChunk(0, 0);
    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);

    gs.update({ x: 0, y: 0, z: 0 }, facingForward, noInput);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);

    expect(bus.events("gathering:node_nearby").length).toBe(0);
    expect(bus.events("gathering:harvested").length).toBe(0);
    expect(bus.events("gathering:depleted").length).toBe(0);
  });

  it("respawnAll clears persisted depletion and respawns loaded nodes", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const herbDef = RESOURCE_DEFINITIONS.find((def) => def.id === "herb");
    const scatter = {
      getNodesForChunk: () => [
        { worldX: 0, worldZ: 2, definition: herbDef }
      ]
    };
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: scatter,
      uiBus: bus
    });
    const interact = { isJustPressed: (action) => action === Action.Interact };

    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);

    expect(gs.serializeDepletionSnapshot()).toEqual({
      version: 1,
      depletedKeys: ["0,0:0:herb:0:2"]
    });

    bus.clear();
    gs.respawnAll();

    expect(gs.serializeDepletionSnapshot()).toEqual({
      version: 1,
      depletedKeys: []
    });

    gs.update({ x: 0, y: 0, z: 0 }, facingForward, noInput);

    expect(bus.events("gathering:node_nearby").length).toBe(1);

    bus.clear();
    gs.despawnNodesForChunk(0, 0);
    bus.clear();
    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, noInput);

    expect(bus.events("gathering:node_nearby").length).toBe(1);

    bus.clear();
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, interact);

    expect(bus.events("gathering:harvested").length).toBe(1);
  });

  it("emits node_left immediately when despawning the nearby chunk node", () => {
    const scene = createFakeScene();
    const rapier = createFakeRapier();
    const bus = new MockUIBus();
    const woodDef = RESOURCE_DEFINITIONS.find((def) => def.id === "wood");
    const scatter = {
      getNodesForChunk: () => [
        { worldX: 0, worldZ: 2, definition: woodDef }
      ]
    };
    const gs = new GatheringSystem({
      scene,
      rapier,
      resourceScatter: scatter,
      uiBus: bus
    });

    gs.spawnNodesForChunk(0, 0, "hearthmere", () => 0);
    gs.update({ x: 0, y: 0, z: 0 }, facingForward, noInput);
    bus.clear();
    gs.despawnNodesForChunk(0, 0);

    const left = bus.events("gathering:node_left");
    expect(left.length).toBe(1);
  });
});
