import { describe, expect, it, beforeEach } from "@jest/globals";

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
