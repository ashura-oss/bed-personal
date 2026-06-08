import * as THREE from "three";
import {
  HEARTHMERE_PALETTE,
  addMesh,
  createArtTracker,
  makeMaterialSet
} from "./art/HearthmereArtKit.js";

const INTERACT_RADIUS = 3.2; // distance for the E-prompt
const FLICKER_SPEED = 1.8; // Hz of light intensity oscillation

export class Hearthlight {
  constructor(scene, position, callbacks) {
    this.time = 0;
    this._isPlayerNear = false;
    this.scene = scene;
    this.callbacks = callbacks;
    this._artTracker = createArtTracker();
    this._flameMeshes = [];
    this._flameMaterials = [];

    this.group = new THREE.Group();
    this.group.name = "hearthlight-shrine";
    this._buildShrine();

    // Warm point light — the Hearthlight's glow
    this.light = new THREE.PointLight(0xff9a28, 4, 9);
    this.light.position.y = 1.12;
    this.light.castShadow = false; // perf budget

    this.group.add(this.light);
    this.group.position.set(position.x, position.y, position.z);
    scene.add(this.group);
  }

  get isPlayerNear() {
    return this._isPlayerNear;
  }

  /**
   * Called from main loop. Handles proximity detection and flame flicker.
   * Returns true if the player is within interaction range.
   */
  update(dt, playerWorldPos, interactJustPressed) {
    this.time += dt;

    // Flicker: subtle sine oscillation on light intensity
    const flicker = Math.sin(this.time * FLICKER_SPEED * Math.PI * 2) * 0.6
      + Math.sin(this.time * FLICKER_SPEED * 2.7 * Math.PI * 2) * 0.25;
    this.light.intensity = 3.8 + flicker;

    for (let index = 0; index < this._flameMaterials.length; index += 1) {
      const material = this._flameMaterials[index];
      material.emissiveIntensity = 1.8 + index * 0.45 + flicker * 0.22;
    }

    for (let index = 0; index < this._flameMeshes.length; index += 1) {
      const flame = this._flameMeshes[index];
      const pulse = 1 + Math.sin(this.time * 5.6 + index * 1.7) * 0.04;
      flame.scale.set(flame.userData.baseScaleX * pulse, flame.userData.baseScaleY, flame.userData.baseScaleZ * pulse);
      flame.rotation.y += dt * (0.65 + index * 0.18);
    }

    // Proximity check
    const dx = playerWorldPos.x - this.group.position.x;
    const dz = playerWorldPos.z - this.group.position.z;
    const dist2 = dx * dx + dz * dz;
    this._isPlayerNear = dist2 <= INTERACT_RADIUS * INTERACT_RADIUS;

    if (this._isPlayerNear && interactJustPressed) {
      this.callbacks.onRest(this);
    }

    return this._isPlayerNear;
  }

  dispose() {
    this.scene.remove(this.group);
    this._artTracker.dispose();
  }

  _buildShrine() {
    const materials = makeMaterialSet(this._artTracker, {
      ash: 0x3a332b,
      soot: 0x15120f,
      oldWood: 0x332218,
      tarnishedIron: 0x45413b,
      ember: HEARTHMERE_PALETTE.ember,
      emberGold: HEARTHMERE_PALETTE.emberGold
    });

    addMesh(this.group, this._artTracker, new THREE.CylinderGeometry(0.48, 0.58, 0.16, 10), materials.ash, {
      position: [0, 0.08, 0],
      scale: [1, 1, 0.86],
      name: "hearthlight-lower-stone-ring"
    });
    addMesh(this.group, this._artTracker, new THREE.CylinderGeometry(0.36, 0.44, 0.2, 9), materials.mud, {
      position: [0.02, 0.25, -0.01],
      rotation: [0, 0.18, 0],
      scale: [1.08, 1, 0.82],
      name: "hearthlight-worn-plinth"
    });
    addMesh(this.group, this._artTracker, new THREE.CylinderGeometry(0.25, 0.32, 0.24, 8), materials.ash, {
      position: [-0.02, 0.47, 0.02],
      rotation: [0.02, -0.16, 0],
      scale: [0.9, 1, 0.74],
      name: "hearthlight-upper-stone"
    });

    const looseStoneGeo = new THREE.DodecahedronGeometry(0.12, 0);
    for (const [x, z, s, ry] of [
      [-0.38, 0.22, 0.8, 0.2],
      [0.38, -0.1, 0.66, -0.5],
      [0.1, -0.4, 0.58, 0.9],
      [-0.1, 0.4, 0.52, -0.8]
    ]) {
      addMesh(this.group, this._artTracker, looseStoneGeo.clone(), materials.ash, {
        position: [x, 0.12, z],
        rotation: [0.2, ry, -0.1],
        scale: [s, s * 0.72, s],
        name: "hearthlight-scattered-stone"
      });
    }

    const ribGeo = new THREE.CylinderGeometry(0.025, 0.04, 1.05, 6);
    for (const side of [-1, 1]) {
      addMesh(this.group, this._artTracker, ribGeo.clone(), materials.tarnishedIron, {
        position: [side * 0.31, 0.82, -0.02],
        rotation: [0.18, side * 0.18, side * 0.34],
        scale: [1, 1, 0.9],
        name: "hearthlight-bent-iron-rib"
      });
      addMesh(this.group, this._artTracker, new THREE.ConeGeometry(0.055, 0.16, 6), materials.tarnishedIron, {
        position: [side * 0.47, 1.34, -0.05],
        rotation: [0.2, 0, side * -0.2],
        name: "hearthlight-rib-spike"
      });
    }

    addMesh(this.group, this._artTracker, new THREE.CylinderGeometry(0.3, 0.24, 0.16, 12), materials.tarnishedIron, {
      position: [0, 0.68, 0],
      scale: [1, 1, 0.72],
      name: "hearthlight-charred-brazier"
    });
    addMesh(this.group, this._artTracker, new THREE.CylinderGeometry(0.2, 0.26, 0.08, 12), materials.soot, {
      position: [0, 0.76, 0],
      scale: [1, 1, 0.7],
      name: "hearthlight-ash-bed"
    });

    const runeGeo = new THREE.BoxGeometry(0.035, 0.18, 0.012);
    for (const [x, y, z, rz] of [
      [-0.18, 0.42, 0.22, -0.2],
      [0.2, 0.36, 0.2, 0.22],
      [0.02, 0.56, 0.2, 0.02]
    ]) {
      addMesh(this.group, this._artTracker, runeGeo.clone(), materials.ember, {
        position: [x, y, z],
        rotation: [0.2, 0, rz],
        castShadow: false,
        receiveShadow: false,
        name: "hearthlight-glowing-rune"
      });
    }

    this._addFlameLayer({
      geometry: new THREE.ConeGeometry(0.18, 0.58, 7),
      color: 0xff8c24,
      emissive: HEARTHMERE_PALETTE.ember,
      intensity: 2.15,
      position: [0, 1.02, 0],
      scale: [0.82, 1, 0.82],
      name: "hearthlight-outer-flame"
    });
    this._addFlameLayer({
      geometry: new THREE.ConeGeometry(0.12, 0.42, 6),
      color: HEARTHMERE_PALETTE.emberGold,
      emissive: 0xff9f2f,
      intensity: 2.65,
      position: [0.02, 1.05, 0.02],
      scale: [0.7, 1, 0.7],
      name: "hearthlight-inner-flame"
    });
    this._addFlameLayer({
      geometry: new THREE.SphereGeometry(0.09, 10, 8),
      color: 0xffd89a,
      emissive: HEARTHMERE_PALETTE.emberGold,
      intensity: 2.2,
      position: [-0.02, 0.92, 0],
      scale: [1, 0.62, 1],
      name: "hearthlight-ember-core"
    });
  }

  _addFlameLayer({ geometry, color, emissive, intensity, position, scale, name }) {
    const material = this._artTracker.material({
      color,
      emissive,
      emissiveIntensity: intensity,
      roughness: 0.34,
      metalness: 0.02,
      transparent: true,
      opacity: 0.9
    });
    const flame = addMesh(this.group, this._artTracker, geometry, material, {
      position,
      scale,
      castShadow: false,
      receiveShadow: false,
      name
    });
    flame.userData.baseScaleX = scale[0];
    flame.userData.baseScaleY = scale[1];
    flame.userData.baseScaleZ = scale[2];
    this._flameMeshes.push(flame);
    this._flameMaterials.push(material);
  }
}
