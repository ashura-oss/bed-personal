import * as THREE from "three";
import { STATE } from "./WanderingEnemy.js";

// ── Colours by state ──────────────────────────────────────────────────────────

const COLOR_NEUTRAL = 0x886644; // idle / wander — brownish
const COLOR_AGGRO   = 0xcc3322; // chase / attack — red
const COLOR_RETURN  = 0x4488aa; // retreating — blue
const COLOR_DEAD    = 0x333333; // dead — grey

// ── Geometry constants ────────────────────────────────────────────────────────

const CAPSULE_RADIUS = 0.4;
const CAPSULE_LENGTH = 1.0;

// y-offset so the capsule stands with feet at y=0
const MESH_Y_OFFSET = CAPSULE_RADIUS + CAPSULE_LENGTH * 0.5 + 0.05;

// HP bar dimensions
const HP_BAR_WIDTH  = 0.9;
const HP_BAR_HEIGHT = 0.08;
const HP_BAR_Y      = MESH_Y_OFFSET + CAPSULE_RADIUS + CAPSULE_LENGTH * 0.5 + 0.25;

// ── WanderingEnemyVisual ──────────────────────────────────────────────────────

/**
 * Three.js greybox representation of a WanderingEnemy.
 *
 * Owns all Three.js objects; delegates all AI/state logic to the injected
 * `enemy` (WanderingEnemy instance).
 *
 * The spawner/controller owns `enemy.position.y`; the visual preserves that
 * terrain-aligned value when syncing the Three.js group.
 */
export class WanderingEnemyVisual {
  #scene;
  #enemy;
  #group;
  #bodyMesh;
  #bodyMaterial;
  #hpBarFill;
  #hpBarFillMaterial;
  #hpBarBacking;

  /**
   * @param {{ scene: THREE.Scene, enemy: import("./WanderingEnemy.js").WanderingEnemy }} opts
   */
  constructor({ scene, enemy }) {
    this.#scene = scene;
    this.#enemy = enemy;

    this.#group = new THREE.Group();

    // ── Body capsule ──────────────────────────────────────────────────────────
    const capsuleGeo = new THREE.CapsuleGeometry(CAPSULE_RADIUS, CAPSULE_LENGTH, 6, 10);
    this.#bodyMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_NEUTRAL,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.#bodyMesh = new THREE.Mesh(capsuleGeo, this.#bodyMaterial);
    this.#bodyMesh.castShadow = true;
    this.#bodyMesh.receiveShadow = true;
    this.#bodyMesh.position.y = MESH_Y_OFFSET;
    this.#group.add(this.#bodyMesh);

    // ── HP bar — white backing ────────────────────────────────────────────────
    const backGeo = new THREE.PlaneGeometry(HP_BAR_WIDTH, HP_BAR_HEIGHT);
    const backMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.#hpBarBacking = new THREE.Mesh(backGeo, backMat);
    this.#hpBarBacking.position.set(0, HP_BAR_Y, 0);
    this.#group.add(this.#hpBarBacking);

    // ── HP bar — red fill (anchored left) ─────────────────────────────────────
    const fillGeo = new THREE.PlaneGeometry(HP_BAR_WIDTH, HP_BAR_HEIGHT);
    this.#hpBarFillMaterial = new THREE.MeshBasicMaterial({
      color: 0xdd1111,
      side: THREE.DoubleSide,
    });
    this.#hpBarFill = new THREE.Mesh(fillGeo, this.#hpBarFillMaterial);
    // Pivot the fill at its left edge so scale.x shrinks it rightward.
    this.#hpBarFill.geometry.translate(HP_BAR_WIDTH * 0.5, 0, 0);
    this.#hpBarFill.position.set(-HP_BAR_WIDTH * 0.5, HP_BAR_Y, 0.001);
    this.#group.add(this.#hpBarFill);

    scene.add(this.#group);

    // Sync position immediately so there's no one-frame pop.
    this._syncPosition();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Call every frame after the enemy's update() has run.
   * dt is accepted for API symmetry with other visual classes but is not yet
   * consumed (no animation in this greybox).
   */
  // eslint-disable-next-line no-unused-vars
  update(dt) {
    if (this.#enemy.isDead) {
      this.#group.visible = false;
      return;
    }

    this._syncPosition();
    this._syncColor();
    this._syncHpBar();

    // Billboard HP bar to always face +Z (camera-facing is handled by scene camera elsewhere;
    // keeping it simple — face world +Z for greybox purposes).
    this.#hpBarBacking.lookAt(
      this.#hpBarBacking.getWorldPosition(new THREE.Vector3()).setZ(
        this.#hpBarBacking.getWorldPosition(new THREE.Vector3()).z + 1,
      ),
    );
    this.#hpBarFill.lookAt(
      this.#hpBarFill.getWorldPosition(new THREE.Vector3()).setZ(
        this.#hpBarFill.getWorldPosition(new THREE.Vector3()).z + 1,
      ),
    );
  }

  /** Remove all Three.js objects from the scene and dispose GPU resources. */
  dispose() {
    this.#scene.remove(this.#group);
    this.#bodyMesh.geometry.dispose();
    this.#bodyMaterial.dispose();
    this.#hpBarFill.geometry.dispose();
    this.#hpBarFillMaterial.dispose();
    this.#hpBarBacking.geometry.dispose();
    this.#hpBarBacking.material.dispose();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _syncPosition() {
    const ep = this.#enemy.position;
    this.#group.position.set(ep.x, ep.y, ep.z);
  }

  _syncColor() {
    const label = this.#enemy.stateLabel;
    let color;
    switch (label) {
      case STATE.CHASE:
      case STATE.ATTACK:
        color = COLOR_AGGRO;
        break;
      case STATE.RETURN:
        color = COLOR_RETURN;
        break;
      case STATE.DEAD:
        color = COLOR_DEAD;
        break;
      default:
        // idle, wander
        color = COLOR_NEUTRAL;
        break;
    }
    this.#bodyMaterial.color.setHex(color);
  }

  _syncHpBar() {
    const ratio = Math.max(0, Math.min(1, this.#enemy.hp / this.#enemy.maxHp));
    this.#hpBarFill.scale.x = ratio;
  }
}
