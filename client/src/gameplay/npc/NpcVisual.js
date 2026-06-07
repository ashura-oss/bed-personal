import * as THREE from "three";

/**
 * NpcVisual — Three.js greybox for a single NPC.
 *
 * Owns all Three.js objects. Delegates all logic to the injected NpcController.
 * Mirrors the WanderingEnemyVisual pattern exactly.
 *
 * Capsule body coloured by definition.color.
 * A small floating cone marker above the head signals "talk to me".
 * setHighlighted(true) scales/brightens the marker when the player is in range.
 */

const CAPSULE_RADIUS = 0.4;
const CAPSULE_LENGTH = 1.1;

// Capsule base sits at y=0, centre of capsule is at y = radius + length/2
const MESH_Y_OFFSET = CAPSULE_RADIUS + CAPSULE_LENGTH * 0.5 + 0.05;

// Marker floats above the top of the capsule
const MARKER_Y = MESH_Y_OFFSET + CAPSULE_RADIUS + CAPSULE_LENGTH * 0.5 + 0.45;
const MARKER_BASE_SCALE = 1.0;
const MARKER_HIGHLIGHT_SCALE = 1.35;

const MARKER_COLOR_DEFAULT    = 0xffdd88;
const MARKER_COLOR_HIGHLIGHTED = 0xffffff;

export class NpcVisual {
  #scene;
  #npc;
  #group;
  #bodyMesh;
  #bodyMaterial;
  #markerMesh;
  #markerMaterial;
  #markerBobTime;
  #highlighted;

  /**
   * @param {{ scene: THREE.Scene, npc: import('./NpcController.js').NpcController }} opts
   */
  constructor({ scene, npc }) {
    this.#scene = scene;
    this.#npc = npc;
    this.#markerBobTime = 0;
    this.#highlighted = false;

    this.#group = new THREE.Group();

    // ── Body capsule ──────────────────────────────────────────────────────────
    const capsuleGeo = new THREE.CapsuleGeometry(CAPSULE_RADIUS, CAPSULE_LENGTH, 6, 10);
    this.#bodyMaterial = new THREE.MeshStandardMaterial({
      color: npc.definition.color,
      roughness: 0.8,
      metalness: 0.05
    });
    this.#bodyMesh = new THREE.Mesh(capsuleGeo, this.#bodyMaterial);
    this.#bodyMesh.castShadow = true;
    this.#bodyMesh.receiveShadow = true;
    this.#bodyMesh.position.y = MESH_Y_OFFSET;
    this.#group.add(this.#bodyMesh);

    // ── Talk marker — small floating cone ─────────────────────────────────────
    const markerGeo = new THREE.ConeGeometry(0.12, 0.28, 6);
    this.#markerMaterial = new THREE.MeshStandardMaterial({
      color: MARKER_COLOR_DEFAULT,
      roughness: 0.4,
      metalness: 0.1,
      emissive: new THREE.Color(MARKER_COLOR_DEFAULT),
      emissiveIntensity: 0.3
    });
    this.#markerMesh = new THREE.Mesh(markerGeo, this.#markerMaterial);
    this.#markerMesh.position.y = MARKER_Y;
    this.#group.add(this.#markerMesh);

    scene.add(this.#group);

    // Sync immediately to avoid a one-frame pop.
    this._syncTransform();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Call every frame after npc.update() has run.
   *
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    this._syncTransform();

    // Gently bob the marker up and down
    this.#markerBobTime += dt * 2.2;
    const bob = Math.sin(this.#markerBobTime) * 0.06;
    this.#markerMesh.position.y = MARKER_Y + bob;
    this.#markerMesh.rotation.y += dt * 1.0;
  }

  /**
   * Brighten/scale the marker when the player enters interact range.
   *
   * @param {boolean} on
   */
  setHighlighted(on) {
    if (this.#highlighted === on) return;
    this.#highlighted = on;

    if (on) {
      this.#markerMaterial.color.setHex(MARKER_COLOR_HIGHLIGHTED);
      this.#markerMaterial.emissive.setHex(MARKER_COLOR_HIGHLIGHTED);
      this.#markerMaterial.emissiveIntensity = 0.8;
      this.#markerMesh.scale.setScalar(MARKER_HIGHLIGHT_SCALE);
    } else {
      this.#markerMaterial.color.setHex(MARKER_COLOR_DEFAULT);
      this.#markerMaterial.emissive.setHex(MARKER_COLOR_DEFAULT);
      this.#markerMaterial.emissiveIntensity = 0.3;
      this.#markerMesh.scale.setScalar(MARKER_BASE_SCALE);
    }
  }

  /** Remove all Three.js objects from the scene and release GPU resources. */
  dispose() {
    this.#scene.remove(this.#group);
    this.#bodyMesh.geometry.dispose();
    this.#bodyMaterial.dispose();
    this.#markerMesh.geometry.dispose();
    this.#markerMaterial.dispose();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _syncTransform() {
    const p = this.#npc.position;
    this.#group.position.set(p.x, p.y, p.z);
    this.#group.rotation.y = this.#npc.facingAngle;
  }
}
