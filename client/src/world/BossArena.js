import * as THREE from "three";
import { BossController } from "../gameplay/enemies/BossController.js";
import { addMesh, createArtTracker, makeMaterialSet } from "./art/HearthmereArtKit.js";
import { FogGate } from "./FogGate.js";

// ── Pure state machine ─────────────────────────────────────────────────────────

/** All possible arena lifecycle states. */
export const ARENA_STATE = Object.freeze({
  DORMANT: "dormant",
  ARMED: "armed",
  ACTIVE: "active",
  CLEARED: "cleared",
});

/**
 * Computes the next arena activation state from the current state and a set of
 * distance/condition inputs. Pure function — no imports, no side effects.
 *
 * Transitions:
 *   DORMANT  → ARMED   when distanceToGate  <= armRadius
 *   ARMED    → ACTIVE  when distanceToCenter <= sealRadius
 *   ACTIVE   → CLEARED when bossDefeated is true
 *   CLEARED  stays CLEARED (terminal)
 *
 * @param {string} current - one of ARENA_STATE values
 * @param {{ distanceToGate: number, distanceToCenter: number, armRadius: number, sealRadius: number, bossDefeated: boolean }} params
 * @returns {string} next state
 */
export function computeArenaState(current, { distanceToGate, distanceToCenter, armRadius, sealRadius, bossDefeated }) {
  if (current === ARENA_STATE.CLEARED) return ARENA_STATE.CLEARED;
  if (bossDefeated) return ARENA_STATE.CLEARED;
  if (current === ARENA_STATE.ACTIVE) return ARENA_STATE.ACTIVE;
  if (current === ARENA_STATE.DORMANT && distanceToGate <= armRadius) return ARENA_STATE.ARMED;
  if (current === ARENA_STATE.ARMED && distanceToCenter <= sealRadius) return ARENA_STATE.ACTIVE;
  return current;
}

// ── BossArena class ────────────────────────────────────────────────────────────

const ARENA_FLOOR_RADIUS = 14;
const ARENA_FLOOR_Y_OFFSET = 0.02; // slightly above terrain to avoid z-fight
const ARENA_RING_RUNE_COUNT = 12;

function createArenaFloor(center) {
  const tracker = createArtTracker();
  const materials = makeMaterialSet(tracker, {
    mud: 0x211817,
    soot: 0x100d0c,
    ash: 0x332d29,
    ember: 0xff5a18,
    emberGold: 0xffb15c,
    focusBlue: 0x82d8d0,
  });
  const group = new THREE.Group();
  group.name = "hearthmere-boss-arena-floor";

  addMesh(group, tracker, new THREE.CylinderGeometry(ARENA_FLOOR_RADIUS, ARENA_FLOOR_RADIUS * 0.96, 0.08, 64), materials.soot, {
    position: [0, 0, 0],
    receiveShadow: true,
    castShadow: false,
    name: "sunken-crypt-arena-base",
  });

  addMesh(group, tracker, new THREE.CylinderGeometry(ARENA_FLOOR_RADIUS * 0.74, ARENA_FLOOR_RADIUS * 0.72, 0.045, 64), materials.mud, {
    position: [0, 0.052, 0],
    receiveShadow: true,
    castShadow: false,
    name: "worn-inner-fighting-stone",
  });

  const outerSlabGeo = new THREE.BoxGeometry(1.02, 0.11, 0.46);
  tracker.trackGeometry(outerSlabGeo);
  for (let i = 0; i < 32; i += 1) {
    const angle = (i / 32) * Math.PI * 2;
    const radius = ARENA_FLOOR_RADIUS * 0.94 + (i % 3) * 0.04;
    addMesh(group, tracker, outerSlabGeo.clone(), i % 5 === 0 ? materials.ash : materials.mud, {
      position: [Math.sin(angle) * radius, 0.105, Math.cos(angle) * radius],
      rotation: [0, angle, 0],
      scale: [1 + (i % 4) * 0.05, 1, 0.85 + (i % 2) * 0.2],
      name: "uneven-arena-rim-stone",
    });
  }

  const seamGeo = new THREE.BoxGeometry(0.055, 0.028, ARENA_FLOOR_RADIUS * 1.55);
  tracker.trackGeometry(seamGeo);
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    addMesh(group, tracker, seamGeo.clone(), materials.soot, {
      position: [0, 0.128, 0],
      rotation: [0, angle, 0],
      receiveShadow: false,
      castShadow: false,
      name: "charred-arena-floor-seam",
    });
  }

  for (const radius of [4.8, 8.6, 12.2]) {
    addMesh(group, tracker, new THREE.TorusGeometry(radius, 0.035, 6, 80), materials.ash, {
      position: [0, 0.155, 0],
      rotation: [Math.PI / 2, 0, 0],
      receiveShadow: false,
      castShadow: false,
      name: "inlaid-crypt-arena-ring",
    });
  }

  const runeGeo = new THREE.BoxGeometry(0.14, 0.036, 0.74);
  const chipGeo = new THREE.BoxGeometry(0.22, 0.034, 0.12);
  tracker.trackGeometry(runeGeo);
  tracker.trackGeometry(chipGeo);
  for (let i = 0; i < ARENA_RING_RUNE_COUNT; i += 1) {
    const angle = (i / ARENA_RING_RUNE_COUNT) * Math.PI * 2;
    const radius = 7.15 + (i % 2) * 0.42;
    addMesh(group, tracker, runeGeo.clone(), i % 3 === 0 ? materials.ember : materials.focus, {
      position: [Math.sin(angle) * radius, 0.19, Math.cos(angle) * radius],
      rotation: [0, angle, 0],
      scale: [1, 1, 0.72 + (i % 4) * 0.08],
      receiveShadow: false,
      castShadow: false,
      name: "low-burning-boss-arena-rune",
    });
    addMesh(group, tracker, chipGeo.clone(), materials.soot, {
      position: [Math.sin(angle + 0.12) * (radius + 0.9), 0.18, Math.cos(angle + 0.12) * (radius + 0.9)],
      rotation: [0, angle + 0.55, 0],
      receiveShadow: false,
      castShadow: false,
      name: "broken-rune-fill-chip",
    });
  }

  group.position.set(center.x, center.y + ARENA_FLOOR_Y_OFFSET, center.z);
  return { group, tracker };
}

/**
 * BossArena — a modular, reusable fog-gated boss encounter placed at an
 * authored world location. Owns the FogGate visual and BossController
 * and drives both via the pure computeArenaState machine.
 *
 * Architecture note: no ui/ imports. All communication is through the
 * callbacks object passed by main.js, which maps them to UIBus events.
 */
export class BossArena {
  /**
   * @param {{
   *   scene: THREE.Scene,
   *   rapier: { module: object, world: object },
   *   center: { x: number, y: number, z: number },
   *   gatePosition: { x: number, y: number, z: number },
   *   id?: string,
   *   bossName: string,
   *   callbacks?: {
   *     onArmed?: () => void,
   *     onEntered?: ({ id: string, bossName: string, name: string }) => void,
   *     onBossDied?: (emberReward: number, identity: { id: string, bossName: string, name: string }) => void,
   *     onHpChanged?: (hp: number, max: number, phase: number) => void,
   *     onPhaseChanged?: (phase: number, context: object) => void,
   *     onAttack?: (type: string, damage: number) => void,
   *     onStaggered?: () => void,
   *   }
   * }} opts
   */
  constructor({ scene, rapier, center, gatePosition, id, bossName, callbacks = {} }) {
    this._scene = scene;
    this._id = id ?? bossName;
    this._bossName = bossName;
    this._identity = Object.freeze({
      id: this._id,
      bossName: this._bossName,
      name: this._bossName,
    });
    this._callbacks = callbacks;
    this._state = ARENA_STATE.DORMANT;
    this._bossDefeated = false;

    // ── Hearthmere arena floor ─────────────────────────────────────────────
    const arenaFloor = createArenaFloor(center);
    this._floorGroup = arenaFloor.group;
    this._floorTracker = arenaFloor.tracker;
    scene.add(this._floorGroup);

    // ── Fog gate (visual-only; BossArena drives sealing via distance) ─────
    // Pass a no-op onCrossed — BossArena activates via computeArenaState, not
    // the gate's own Z-axis trigger. The gate stays visible until ARMED→ACTIVE.
    this._fogGate = new FogGate(scene, gatePosition, () => {});

    // ── Boss controller ────────────────────────────────────────────────────
    this._boss = new BossController(
      scene,
      rapier,
      { x: center.x, y: center.y, z: center.z },
      {
        onHpChanged: (hp, max, phase) => {
          callbacks.onHpChanged?.(hp, max, phase);
        },
        onPhaseChanged: (phase, context) => {
          callbacks.onPhaseChanged?.(phase, this._bossContext(context));
        },
        onAttack: (type, damage) => {
          callbacks.onAttack?.(type, damage);
        },
        onStaggered: () => {
          callbacks.onStaggered?.();
        },
        onDied: (emberReward) => {
          this._bossDefeated = true;
          callbacks.onBossDied?.(emberReward, this._identity);
        },
      },
    );

    // Store gate position for distance calculations
    this._gatePos = new THREE.Vector3(gatePosition.x, gatePosition.y, gatePosition.z);
    this._centerPos = new THREE.Vector3(center.x, center.y, center.z);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  get active() { return this._state === ARENA_STATE.ACTIVE; }
  get cleared() { return this._state === ARENA_STATE.CLEARED; }
  get state() { return this._state; }
  get id() { return this._id; }
  get bossName() { return this._bossName; }
  get identity() { return this._identity; }
  get boss() { return this._boss; }
  get bossPosition() { return this._boss.position; }

  /**
   * Main per-frame update. Advances the state machine, fires transition
   * callbacks, and (when ACTIVE) updates the boss AI.
   *
   * @param {number} dt - delta time in seconds
   * @param {THREE.Vector3} playerPos - current player world position
   * @param {boolean} playerHasIframes - true while player is i-frame invulnerable
   * @returns {string} current ARENA_STATE value
   */
  update(dt, playerPos, playerHasIframes) {
    const prev = this._state;

    const distanceToGate = this._gatePos.distanceTo(playerPos);
    const distanceToCenter = this._centerPos.distanceTo(playerPos);

    const next = computeArenaState(prev, {
      distanceToGate,
      distanceToCenter,
      armRadius: this._armRadius,
      sealRadius: this._sealRadius,
      bossDefeated: this._bossDefeated,
    });

    if (next !== prev) {
      this._state = next;
      this._onTransition(prev, next);
    }

    if (this._state === ARENA_STATE.ACTIVE || this._boss.dissolveTimer > 0) {
      this._boss.update(dt, playerPos, playerHasIframes);
    }

    return this._state;
  }

  /**
   * Forward a player attack to the boss if within range.
   *
   * @param {number} damage - HP damage
   * @param {number} poiseDamage - poise damage
   * @param {THREE.Vector3} playerPos - attacker position
   * @param {number} [range=3.0] - attack reach in world units
   * @returns {boolean} true if the hit was registered
   */
  tryHit(damage, poiseDamage, playerPos, range = 3.0) {
    if (!this.active || !this._boss.isAlive) return false;
    const dx = this._boss.position.x - playerPos.x;
    const dz = this._boss.position.z - playerPos.z;
    if (dx * dx + dz * dz <= range * range) {
      this._boss.hit(damage, poiseDamage);
      return true;
    }
    return false;
  }

  /** Clean up Three.js objects and physics bodies. */
  dispose() {
    this._fogGate.dispose();
    this._boss.dispose();
    this._scene.remove(this._floorGroup);
    this._floorTracker.dispose();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  // Default radii; BossArena.fromConfig() overrides these from the data object.
  _armRadius = 45;
  _sealRadius = 18;

  _onTransition(from, to) {
    if (to === ARENA_STATE.ARMED) {
      this._callbacks.onArmed?.();
    }
    if (to === ARENA_STATE.ACTIVE) {
      // Seal the fog gate visually once the player has passed inside.
      this._fogGate.seal();
      this._callbacks.onEntered?.(this._identity);
    }
    // CLEARED is handled upstream: onBossDied fires from the boss callback
    // which runs before the state machine sees bossDefeated=true, so the
    // caller has the ember reward before the transition is confirmed.
  }

  _bossContext(context = {}) {
    const maxHp = context.maxHp ?? context.max;
    const hp = context.hp ?? context.current ?? this._boss.hp;
    return {
      ...this._identity,
      ...context,
      phase: context.phase ?? this._boss.currentPhase,
      hp,
      current: context.current ?? hp,
      maxHp,
      max: context.max ?? maxHp,
    };
  }
}

/**
 * Factory: construct a BossArena from a data-driven arena definition object.
 *
 * @param {{
 *   scene: THREE.Scene,
 *   rapier: object,
 *   definition: { id?: string, center: {x,z}, gatePosition: {x,z}, armRadius: number, sealRadius: number, bossName: string },
 *   groundAt: (x: number, z: number) => number,
 *   callbacks?: object
 * }} opts
 * @returns {BossArena}
 */
export function createBossArena({ scene, rapier, definition, groundAt, callbacks = {} }) {
  const { id, center, gatePosition, armRadius, sealRadius, bossName } = definition;

  const arena = new BossArena({
    scene,
    rapier,
    id,
    center: { x: center.x, y: groundAt(center.x, center.z), z: center.z },
    gatePosition: { x: gatePosition.x, y: groundAt(gatePosition.x, gatePosition.z), z: gatePosition.z },
    bossName,
    callbacks,
  });

  arena._armRadius = armRadius;
  arena._sealRadius = sealRadius;

  return arena;
}
