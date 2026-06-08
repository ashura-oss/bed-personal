import { describe, expect, it, beforeEach, jest } from "@jest/globals";

// ── Manual mock for NpcVisual (Three.js-dependent) ────────────────────────────
jest.mock("../gameplay/npc/NpcVisual.js", () => ({
  NpcVisual: jest.fn().mockImplementation(() => ({
    update:         jest.fn(),
    dispose:        jest.fn(),
    setHighlighted: jest.fn()
  }))
}));

import { NpcSpawner } from "../gameplay/npc/NpcSpawner.js";
import { NpcVisual }  from "../gameplay/npc/NpcVisual.js";
import { Action }     from "../controls/InputMap.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBus() {
  const events = [];
  return {
    emit(name, payload) { events.push({ name, payload }); },
    eventsOf(name) { return events.filter(e => e.name === name); },
    clear() { events.length = 0; }
  };
}

function makeScene() {
  return { add: jest.fn(), remove: jest.fn() };
}

const HEIGHT_AT = () => 0;

// Placement source with one NPC at (10, 0, 10) in chunk 0,0 and one non-NPC
function makePlacementSource(extra = []) {
  return {
    getPlacementsForChunk(cx, cz) {
      if (cx !== 0 || cz !== 0) return [];
      return [
        {
          id:   "npc.tessa",
          type: "npc",
          tags: ["tessa", "blacksmith"],
          origin: { x: 10, y: 0, z: 10 }
        },
        {
          id:   "resource.ore",
          type: "resource",
          tags: ["iron_ore"],
          origin: { x: 5, y: 0, z: 5 }
        },
        ...extra
      ];
    }
  };
}

function makeInputMap(interactJustPressed = false) {
  return {
    isJustPressed(action) {
      return action === Action.Interact && interactJustPressed;
    }
  };
}


// ── Tests ─────────────────────────────────────────────────────────────────────

describe("NpcSpawner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. spawnNpcsForChunk creates NPCs from npc-type placements only", () => {
    const bus = makeBus();
    const spawner = new NpcSpawner({
      scene:           makeScene(),
      placementSource: makePlacementSource(),
      uiBus:           bus,
      heightAt:        HEIGHT_AT
    });

    spawner.spawnNpcsForChunk(0, 0);

    // Only 1 NPC placement; resource is ignored
    expect(NpcVisual).toHaveBeenCalledTimes(1);
  });

  it("spawns malformed NPC placements without tags using the traveller fallback", () => {
    const spawner = new NpcSpawner({
      scene: makeScene(),
      placementSource: {
        getPlacementsForChunk() {
          return [
            {
              id: "npc.malformed",
              type: "npc",
              origin: { x: 0, y: 0, z: 0 }
            }
          ];
        }
      },
      uiBus: makeBus(),
      heightAt: HEIGHT_AT
    });

    expect(() => spawner.spawnNpcsForChunk(0, 0)).not.toThrow();
    expect(NpcVisual).toHaveBeenCalledTimes(1);
    expect(NpcVisual.mock.calls[0][0].npc.definition.key).toBe("traveller");
  });

  it("2. despawnNpcsForChunk disposes visuals and clears chunk", () => {
    const bus = makeBus();
    const spawner = new NpcSpawner({
      scene:           makeScene(),
      placementSource: makePlacementSource(),
      uiBus:           bus,
      heightAt:        HEIGHT_AT
    });

    spawner.spawnNpcsForChunk(0, 0);
    const visuals = NpcVisual.mock.results.map(r => r.value);

    spawner.despawnNpcsForChunk(0, 0);

    for (const v of visuals) {
      expect(v.dispose).toHaveBeenCalledTimes(1);
    }

    // Spawning again should work (map was cleared)
    spawner.spawnNpcsForChunk(0, 0);
    expect(NpcVisual).toHaveBeenCalledTimes(2);
  });

  it("3. update emits npc:nearby when player is close and facing the NPC", () => {
    const bus = makeBus();
    const spawner = new NpcSpawner({
      scene:           makeScene(),
      placementSource: makePlacementSource(),
      uiBus:           bus,
      heightAt:        HEIGHT_AT
    });

    spawner.spawnNpcsForChunk(0, 0);

    // NPC is at (10,0,10). Player at (8,0,10) facing +X is within 3.5u and toward it
    const playerPos     = { x: 8, y: 0, z: 10 };
    const playerFacing  = { x: 1, y: 0, z: 0 };
    const inputMap      = makeInputMap(false);

    expect(spawner.hasInteractable(playerPos, playerFacing)).toBe(true);
    expect(spawner.hasInteractable({ x: 8, y: 0, z: 10 }, { x: -1, y: 0, z: 0 })).toBe(false);

    spawner.update(0.016, playerPos, playerFacing, inputMap);

    const nearby = bus.eventsOf("npc:nearby");
    expect(nearby.length).toBe(1);
    expect(nearby[0].payload.npcId).toBe("npc.tessa");
    expect(typeof nearby[0].payload.name).toBe("string");
  });

  it("4. update emits npc:interact on Action.Interact when nearby and no active dialogue", () => {
    const bus = makeBus();
    const spawner = new NpcSpawner({
      scene:           makeScene(),
      placementSource: makePlacementSource(),
      uiBus:           bus,
      heightAt:        HEIGHT_AT
    });

    spawner.spawnNpcsForChunk(0, 0);

    const playerPos    = { x: 8, y: 0, z: 10 };
    const playerFacing = { x: 1, y: 0, z: 0 };
    const inputMap     = makeInputMap(true);

    spawner.update(0.016, playerPos, playerFacing, inputMap);

    const interact = bus.eventsOf("npc:interact");
    expect(interact.length).toBe(1);
    expect(interact[0].payload.npcId).toBe("npc.tessa");
    expect(typeof interact[0].payload.dialogueId).toBe("string");
  });

  it("5. update does NOT emit npc:interact when a dialogue is already active", () => {
    const bus = makeBus();
    const spawner = new NpcSpawner({
      scene:           makeScene(),
      placementSource: makePlacementSource(),
      uiBus:           bus,
      heightAt:        HEIGHT_AT
    });

    spawner.spawnNpcsForChunk(0, 0);

    const playerPos    = { x: 8, y: 0, z: 10 };
    const playerFacing = { x: 1, y: 0, z: 0 };

    // First interact — starts dialogue
    spawner.update(0.016, playerPos, playerFacing, makeInputMap(true));
    expect(spawner.activeDialogueNpcId).toBe("npc.tessa");
    bus.clear();

    // Second interact while dialogue open — must be ignored
    spawner.update(0.016, playerPos, playerFacing, makeInputMap(true));
    expect(bus.eventsOf("npc:interact").length).toBe(0);
  });

  it("7. despawnNpcsForChunk clears activeDialogueNpcId and emits npc:dialogue_ended when the active-dialogue NPC is despawned", () => {
    const bus = makeBus();
    const spawner = new NpcSpawner({
      scene:           makeScene(),
      placementSource: makePlacementSource(),
      uiBus:           bus,
      heightAt:        HEIGHT_AT
    });

    spawner.spawnNpcsForChunk(0, 0);

    const playerPos    = { x: 8, y: 0, z: 10 };
    const playerFacing = { x: 1, y: 0, z: 0 };

    // Open dialogue with Tessa
    spawner.update(0.016, playerPos, playerFacing, makeInputMap(true));
    expect(spawner.activeDialogueNpcId).toBe("npc.tessa");

    bus.clear();

    // Unload the chunk while dialogue is open (player walked away / chunk streamed out)
    spawner.despawnNpcsForChunk(0, 0);

    // Lock must be cleared
    expect(spawner.activeDialogueNpcId).toBeNull();

    // UI must be told to close
    const ended = bus.eventsOf("npc:dialogue_ended");
    expect(ended.length).toBe(1);
    expect(ended[0].payload.npcId).toBe("npc.tessa");
  });

  it("6. onDialogueEnded clears activeDialogueNpcId so interact works again", () => {
    const bus = makeBus();
    const spawner = new NpcSpawner({
      scene:           makeScene(),
      placementSource: makePlacementSource(),
      uiBus:           bus,
      heightAt:        HEIGHT_AT
    });

    spawner.spawnNpcsForChunk(0, 0);

    const playerPos    = { x: 8, y: 0, z: 10 };
    const playerFacing = { x: 1, y: 0, z: 0 };

    // Open dialogue
    spawner.update(0.016, playerPos, playerFacing, makeInputMap(true));
    expect(spawner.activeDialogueNpcId).toBe("npc.tessa");
    expect(spawner.hasInteractable(playerPos, playerFacing)).toBe(false);

    // End dialogue
    spawner.onDialogueEnded("npc.tessa");
    expect(spawner.activeDialogueNpcId).toBeNull();
    expect(spawner.hasInteractable(playerPos, playerFacing)).toBe(true);

    // Interact again — should re-fire
    bus.clear();
    spawner.update(0.016, playerPos, playerFacing, makeInputMap(true));
    expect(bus.eventsOf("npc:interact").length).toBe(1);
  });
});
