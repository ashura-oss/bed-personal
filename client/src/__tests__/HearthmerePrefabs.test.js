import { describe, expect, it, jest } from "@jest/globals";
import { ASHFALL_ROAD_GATE_PREFAB } from "../world/prefab/prefabs/ashfallRoadGate.js";
import { COPPERSTONE_MINE_PREFAB } from "../world/prefab/prefabs/copperstoneMine.js";
import { HEARTHMERE_CAMP_PREFAB } from "../world/prefab/prefabs/hearthmereCamp.js";
import { HOLLOW_REACH_RUINS_PREFAB } from "../world/prefab/prefabs/hollowReachRuins.js";
import {
  HEARTHMERE_CRYPT_PREFAB,
  buildHearthmere_crypt
} from "../world/prefab/prefabs/hearthmere_crypt.js";
import { HEARTHMERE_BOSS_ARENA } from "../world/regions/hearthmere/placements.js";

const PREFAB_CASES = [
  { name: "ashfall_road_gate", def: ASHFALL_ROAD_GATE_PREFAB, expectedId: "ashfall_road_gate" },
  { name: "copperstone_mine", def: COPPERSTONE_MINE_PREFAB, expectedId: "copperstone_mine" },
  { name: "hollow_reach_ruins", def: HOLLOW_REACH_RUINS_PREFAB, expectedId: "hollow_reach_ruins" },
  { name: "hearthmere_camp", def: HEARTHMERE_CAMP_PREFAB, expectedId: "hearthmere_camp" },
  { name: "hearthmere_crypt", def: HEARTHMERE_CRYPT_PREFAB, expectedId: "hearthmere_crypt" }
];

describe("HearthmerePrefabs — authored prefab definitions", () => {
  for (const { name, def, expectedId } of PREFAB_CASES) {
    describe(name, () => {
      it("exports the expected constant with the correct id", () => {
        expect(def).toBeDefined();
        expect(def.id).toBe(expectedId);
      });

      it("has footprintRadius (number) and blendRadius (number) and build (function)", () => {
        expect(typeof def.footprintRadius).toBe("number");
        expect(typeof def.blendRadius).toBe("number");
        expect(typeof def.build).toBe("function");
      });

      it("footprintRadius is > 0", () => {
        expect(def.footprintRadius).toBeGreaterThan(0);
      });
    });
  }

  describe("hearthmere_crypt boss encounter", () => {
    it("attaches the Hearthmere boss metadata to the crypt prefab", () => {
      expect(HEARTHMERE_CRYPT_PREFAB.bossEncounter).toBe(HEARTHMERE_BOSS_ARENA);
      expect(HEARTHMERE_CRYPT_PREFAB.bossEncounter.prefabId).toBe("hearthmere_crypt");
      expect(HEARTHMERE_CRYPT_PREFAB.bossEncounter.centerOffset).toEqual({ x: 0, z: 12 });
      expect(HEARTHMERE_CRYPT_PREFAB.bossEncounter.gateOffset).toEqual({ x: 0, z: 36 });
    });

    it("covers the encounter gate inside the prefab footprint", () => {
      const gateDistance = Math.hypot(
        HEARTHMERE_BOSS_ARENA.gateOffset.x,
        HEARTHMERE_BOSS_ARENA.gateOffset.z
      );

      expect(HEARTHMERE_CRYPT_PREFAB.footprintRadius).toBeGreaterThanOrEqual(gateDistance);
    });

    it("builds, updates, and disposes the boss arena through the crypt prefab", () => {
      const scene = createSceneStub();
      const fakeArena = {
        update: jest.fn(),
        dispose: jest.fn()
      };
      const createBossArena = jest.fn(() => fakeArena);
      const onBossDied = jest.fn();
      const onEntered = jest.fn();

      const instance = buildHearthmere_crypt({
        scene,
        rapier: null,
        origin: { x: 10, y: 4, z: 20 },
        callbacks: {
          createBossArena,
          groundAt: (x, z) => x + z,
          bossArenaCallbacks: {
            onBossDied,
            onEntered
          }
        }
      });

      expect(instance.bossArenas).toEqual([fakeArena]);
      expect(createBossArena).toHaveBeenCalledWith(expect.objectContaining({
        definition: expect.objectContaining({
          id: "hearthmere.boss.hollowbound_guard",
          center: { x: 10, z: 32 },
          gatePosition: { x: 10, z: 56 }
        })
      }));

      const createArgs = createBossArena.mock.calls[0][0];
      expect(createArgs.groundAt(10, 32)).toBe(42);

      createArgs.callbacks.onEntered();
      expect(onEntered).toHaveBeenCalledWith(expect.objectContaining({
        bossId: "hearthmere.boss.hollowbound_guard",
        encounterId: "hearthmere.encounter.hollowbound_guard",
        name: "Hollowbound Caravan Guard"
      }));

      createArgs.callbacks.onBossDied(600);
      expect(onBossDied).toHaveBeenCalledWith(600, expect.objectContaining({
        bossId: "hearthmere.boss.hollowbound_guard",
        encounterId: "hearthmere.encounter.hollowbound_guard",
        name: "Hollowbound Caravan Guard"
      }));

      const playerPosition = { x: 1, y: 2, z: 3 };
      instance.update(0.25, playerPosition, false, { playerHasIframes: true });
      expect(fakeArena.update).toHaveBeenCalledWith(0.25, playerPosition, true);

      instance.dispose();
      expect(fakeArena.dispose).toHaveBeenCalledTimes(1);
      expect(scene.remove).toHaveBeenCalledWith(instance.group);
    });

    it("does not respawn a defeated boss when the crypt prefab rebuilds", () => {
      const createBossArena = jest.fn();
      const instance = buildHearthmere_crypt({
        scene: createSceneStub(),
        rapier: null,
        origin: { x: -1600, y: 0, z: 300 },
        callbacks: {
          createBossArena,
          isBossDefeated: (bossId) => bossId === "hearthmere.boss.hollowbound_guard"
        }
      });

      expect(createBossArena).not.toHaveBeenCalled();
      expect(instance.bossArenas).toEqual([]);
    });
  });

  describe("hearthmere camp production visuals", () => {
    it("builds fortified caravan outpost dressing without the forge placeholder", () => {
      const instance = HEARTHMERE_CAMP_PREFAB.build({
        scene: createSceneStub(),
        rapier: null,
        origin: { x: 0, y: 0, z: 0 },
        callbacks: {}
      });

      const names = collectObjectNames(instance.group);

      expect(names).toEqual(expect.arrayContaining([
        "hearthmere-camp-muddy-fortified-pad",
        "ashfall-road-rutted-caravan-segment",
        "jagged-caravan-palisade-stake",
        "broken-caravan-bed",
        "hearthmere-field-forge-stone-base",
        "camp-supply-crate",
        "camp-tarred-supply-barrel",
        "torn-hearthmere-camp-banner",
        "camp-live-ember-coal"
      ]));
      expect(names).not.toContain("tessa-forge-placeholder");

      instance.dispose();
    });
  });

  describe("hearthmere crypt production visuals", () => {
    it("builds a sealed boss-path entrance with runes, skulls, rubble, and Worldheart details", () => {
      const instance = buildHearthmere_crypt({
        scene: createSceneStub(),
        rapier: null,
        origin: { x: 0, y: 0, z: 0 },
        callbacks: {
          isBossDefeated: () => true
        }
      });

      const names = collectObjectNames(instance.group);

      expect(names).toEqual(expect.arrayContaining([
        "crypt-sealed-door",
        "crypt-arch-keystone",
        "crypt-arch-voussoir-stone",
        "broken-crypt-flagstone",
        "crypt-rune-plinth-capstone",
        "crypt-skull-marker-left",
        "crypt-skull-marker-right",
        "sealed-door-worldheart-ember-sigil",
        "worldheart-focus-shard",
        "crypt-leaning-rubble-block"
      ]));

      instance.dispose();
    });
  });
});

function createSceneStub() {
  return {
    add: jest.fn(),
    remove: jest.fn()
  };
}

function collectObjectNames(root) {
  const names = [];
  root.traverse((child) => {
    if (child.name) names.push(child.name);
  });
  return names;
}
