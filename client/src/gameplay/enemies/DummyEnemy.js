import * as THREE from "three";
import { TrainingEnemyVisual } from "./TrainingEnemyVisual.js";

// ── Config ────────────────────────────────────────────────────────────────────

const CAPSULE_RADIUS = 0.38;
const CAPSULE_HALF_HEIGHT = 0.5;
const MAX_HP = 100;
const EMBERS_REWARD = 50;
const HIT_FLASH_DURATION = 0.12; // seconds — how long the red flash lasts
const DEATH_ANIM_DURATION = 0.6;
const RESPAWN_DELAY = 8; // seconds after death before respawn

/**
 * DummyEnemy — a training target with HP, a hit flash, a death-shrink, and
 * automatic respawn. Visuals are delegated to TrainingEnemyVisual; this class
 * owns the state machine, the Rapier collider, and the group transform.
 */
export class DummyEnemy {
  hp = MAX_HP;
  isAlive = true;
  hitFlashTimer = 0;
  respawnTimer = 0;
  isDying = false; // in death animation
  dyingTimer = 0;

  constructor(scene, rapier, position) {
    this.scene = scene;
    this.rapier = rapier;
    this.startPosition = new THREE.Vector3(position.x, position.y, position.z);

    this.group = new THREE.Group();
    this.visual = new TrainingEnemyVisual();
    this.group.add(this.visual.group);
    // feet at position.y
    this.group.position.set(
      position.x,
      position.y + CAPSULE_RADIUS + CAPSULE_HALF_HEIGHT,
      position.z,
    );
    scene.add(this.group);

    this.createCollider(position);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  get position() {
    return this.group.position;
  }

  get alive() {
    return this.isAlive;
  }

  get hpRatio() {
    return this.hp / MAX_HP;
  }

  /** Apply damage. Returns a result object describing what happened. */
  hit(damage) {
    if (!this.isAlive || this.isDying) {
      return { damage: 0, died: false, embersRewarded: 0 };
    }

    this.hp = Math.max(0, this.hp - damage);
    this.hitFlashTimer = HIT_FLASH_DURATION;

    const died = this.hp <= 0;
    if (died) {
      this.isDying = true;
      this.dyingTimer = DEATH_ANIM_DURATION;
      this.isAlive = false;
    }

    return { damage, died, embersRewarded: died ? EMBERS_REWARD : 0 };
  }

  /** Reset for Hearthlight respawn. */
  respawn() {
    this.hp = MAX_HP;
    this.isAlive = true;
    this.isDying = false;
    this.dyingTimer = 0;
    this.respawnTimer = 0;
    this.hitFlashTimer = 0;
    this.group.position.copy(this.startPosition);
    this.group.position.y += CAPSULE_RADIUS + CAPSULE_HALF_HEIGHT;
    this.group.scale.setScalar(1);
    this.group.visible = true;
    this.visual.reset();
  }

  update(dt) {
    // Hit flash decay
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) this.hitFlashTimer = 0;
    }

    let deathProgress = 0;

    // Death shrink animation
    if (this.isDying) {
      this.dyingTimer -= dt;
      deathProgress = Math.max(0, 1 - this.dyingTimer / DEATH_ANIM_DURATION);
      const scale = 1 - deathProgress * 0.95;
      this.group.scale.setScalar(Math.max(0.05, scale));
    }

    this.visual.update(
      dt,
      this.hitFlashTimer / HIT_FLASH_DURATION,
      deathProgress,
      this.hpRatio,
      this.isDying,
      this.isAlive,
    );

    if (this.isDying && this.dyingTimer <= 0) {
      this.group.visible = false;
      this.isDying = false;
      this.respawnTimer = RESPAWN_DELAY;
    }

    // Auto respawn countdown
    if (!this.isAlive && !this.isDying && this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.visual.dispose();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  createCollider(pos) {
    const bodyDesc = this.rapier.module.RigidBodyDesc.fixed().setTranslation(
      pos.x,
      pos.y + CAPSULE_RADIUS + CAPSULE_HALF_HEIGHT,
      pos.z,
    );
    const rigidBody = this.rapier.world.createRigidBody(bodyDesc);
    const colliderDesc = this.rapier.module.ColliderDesc.capsule(CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS);
    this.rapier.world.createCollider(colliderDesc, rigidBody);
  }
}
