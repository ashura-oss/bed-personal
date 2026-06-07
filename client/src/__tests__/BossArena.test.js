import * as THREE from "three";
import { describe, expect, it, jest } from "@jest/globals";
import { BossController, BOSS_MAX_HP } from "../gameplay/enemies/BossController.js";
import { ARENA_STATE, computeArenaState, createBossArena } from "../world/BossArena.js";

// Convenience: a default params object so each test only overrides what it cares about.
const defaults = {
  distanceToGate: 100,
  distanceToCenter: 80,
  armRadius: 45,
  sealRadius: 18,
  bossDefeated: false,
};

function params(overrides) {
  return { ...defaults, ...overrides };
}

function makeRapier() {
  const body = { id: "boss-body" };

  return {
    body,
    module: {
      RigidBodyDesc: {
        fixed: () => ({
          setTranslation() {
            return this;
          },
        }),
      },
      ColliderDesc: {
        capsule: jest.fn(() => ({})),
      },
    },
    world: {
      createRigidBody: jest.fn(() => body),
      createCollider: jest.fn(),
      removeRigidBody: jest.fn(),
    },
  };
}

function makeArena(callbacks = {}) {
  return createBossArena({
    scene: new THREE.Scene(),
    rapier: makeRapier(),
    groundAt: () => 0,
    definition: {
      id: "hearthmere.boss.hollowbound_guard",
      bossName: "Hollowbound Caravan Guard",
      center: { x: 0, z: 0 },
      gatePosition: { x: 0, z: 10 },
      armRadius: 45,
      sealRadius: 18,
    },
    callbacks,
  });
}

describe("computeArenaState", () => {
  it("DORMANT stays DORMANT when player is far from the gate", () => {
    const next = computeArenaState(ARENA_STATE.DORMANT, params({ distanceToGate: 100 }));
    expect(next).toBe(ARENA_STATE.DORMANT);
  });

  it("DORMANT → ARMED when distanceToGate <= armRadius (exact boundary)", () => {
    const next = computeArenaState(ARENA_STATE.DORMANT, params({ distanceToGate: 45 }));
    expect(next).toBe(ARENA_STATE.ARMED);
  });

  it("DORMANT → ARMED when distanceToGate is strictly inside armRadius", () => {
    const next = computeArenaState(ARENA_STATE.DORMANT, params({ distanceToGate: 10 }));
    expect(next).toBe(ARENA_STATE.ARMED);
  });

  it("ARMED → ACTIVE when distanceToCenter <= sealRadius (exact boundary)", () => {
    const next = computeArenaState(ARENA_STATE.ARMED, params({ distanceToGate: 10, distanceToCenter: 18 }));
    expect(next).toBe(ARENA_STATE.ACTIVE);
  });

  it("ARMED stays ARMED when player is near gate but not yet past sealRadius", () => {
    const next = computeArenaState(ARENA_STATE.ARMED, params({ distanceToGate: 10, distanceToCenter: 25 }));
    expect(next).toBe(ARENA_STATE.ARMED);
  });

  it("ACTIVE stays ACTIVE even if player walks back out beyond armRadius", () => {
    const next = computeArenaState(ARENA_STATE.ACTIVE, params({ distanceToGate: 200, distanceToCenter: 200 }));
    expect(next).toBe(ARENA_STATE.ACTIVE);
  });

  it("ACTIVE → CLEARED when bossDefeated is true", () => {
    const next = computeArenaState(ARENA_STATE.ACTIVE, params({ bossDefeated: true }));
    expect(next).toBe(ARENA_STATE.CLEARED);
  });

  it("CLEARED is terminal — stays CLEARED regardless of distances", () => {
    const next = computeArenaState(ARENA_STATE.CLEARED, params({ distanceToGate: 0, distanceToCenter: 0 }));
    expect(next).toBe(ARENA_STATE.CLEARED);
  });

  it("CLEARED stays CLEARED even when bossDefeated false (already terminal)", () => {
    const next = computeArenaState(ARENA_STATE.CLEARED, params({ bossDefeated: false }));
    expect(next).toBe(ARENA_STATE.CLEARED);
  });

  it("bossDefeated forces CLEARED from DORMANT (skips normal transitions)", () => {
    const next = computeArenaState(ARENA_STATE.DORMANT, params({ bossDefeated: true }));
    expect(next).toBe(ARENA_STATE.CLEARED);
  });

  it("bossDefeated forces CLEARED from ARMED", () => {
    const next = computeArenaState(ARENA_STATE.ARMED, params({ bossDefeated: true }));
    expect(next).toBe(ARENA_STATE.CLEARED);
  });

  it("DORMANT does not jump to ACTIVE even if distanceToCenter <= sealRadius (gate must arm first)", () => {
    const next = computeArenaState(ARENA_STATE.DORMANT, params({ distanceToGate: 100, distanceToCenter: 5 }));
    expect(next).toBe(ARENA_STATE.DORMANT);
  });

  it("ARMED does not transition back to DORMANT when player moves away from gate", () => {
    const next = computeArenaState(ARENA_STATE.ARMED, params({ distanceToGate: 200, distanceToCenter: 200 }));
    expect(next).toBe(ARENA_STATE.ARMED);
  });
});

describe("BossArena lifecycle identity", () => {
  it("exposes stable id and bossName from the arena definition", () => {
    const arena = makeArena();

    expect(arena.id).toBe("hearthmere.boss.hollowbound_guard");
    expect(arena.bossName).toBe("Hollowbound Caravan Guard");
    expect(arena.identity).toEqual({
      id: "hearthmere.boss.hollowbound_guard",
      bossName: "Hollowbound Caravan Guard",
      name: "Hollowbound Caravan Guard",
    });
  });

  it("includes arena identity when the player enters and when the boss dies", () => {
    const onEntered = jest.fn();
    const onBossDied = jest.fn();
    const arena = makeArena({ onEntered, onBossDied });
    const playerPos = new THREE.Vector3(0, 0, 10);

    arena.update(0.016, playerPos, false);
    arena.update(0.016, playerPos, false);
    arena.boss.hit(BOSS_MAX_HP);

    expect(onEntered).toHaveBeenCalledWith({
      id: "hearthmere.boss.hollowbound_guard",
      bossName: "Hollowbound Caravan Guard",
      name: "Hollowbound Caravan Guard",
    });
    expect(onBossDied).toHaveBeenCalledWith(
      expect.any(Number),
      {
        id: "hearthmere.boss.hollowbound_guard",
        bossName: "Hollowbound Caravan Guard",
        name: "Hollowbound Caravan Guard",
      },
    );
  });

  it("passes phase callbacks enough context to report current boss HP", () => {
    const onPhaseChanged = jest.fn();
    const arena = makeArena({ onPhaseChanged });

    arena.boss.hit(BOSS_MAX_HP * 0.4);

    expect(onPhaseChanged).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        id: "hearthmere.boss.hollowbound_guard",
        bossName: "Hollowbound Caravan Guard",
        phase: 2,
        current: 360,
        max: BOSS_MAX_HP,
        hpRatio: 0.6,
      }),
    );
  });
});

describe("BossController lifecycle", () => {
  it("removes its Rapier rigid body on dispose", () => {
    const scene = new THREE.Scene();
    const rapier = makeRapier();
    const boss = new BossController(scene, rapier, { x: 0, y: 0, z: 0 });

    boss.dispose();

    expect(rapier.world.removeRigidBody).toHaveBeenCalledWith(rapier.body);
  });

  it("removes its Rapier rigid body immediately on death", () => {
    const scene = new THREE.Scene();
    const rapier = makeRapier();
    const boss = new BossController(scene, rapier, { x: 0, y: 0, z: 0 });

    boss.hit(BOSS_MAX_HP);

    expect(rapier.world.removeRigidBody).toHaveBeenCalledWith(rapier.body);
    expect(boss.body).toBeNull();
  });

  it("continues death dissolve updates after entering the dead state", () => {
    const scene = new THREE.Scene();
    const boss = new BossController(scene, makeRapier(), { x: 0, y: 0, z: 0 });

    boss.hit(BOSS_MAX_HP);
    boss.update(1.6, new THREE.Vector3(0, 0, 0), false);

    expect(boss.group.visible).toBe(false);
    expect(boss.group.scale.x).toBeCloseTo(0.02);
  });
});
