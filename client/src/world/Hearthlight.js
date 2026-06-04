import * as THREE from "three";

const INTERACT_RADIUS = 3.2; // distance for the E-prompt
const FLICKER_SPEED = 1.8; // Hz of light intensity oscillation

export class Hearthlight {
  constructor(scene, position, callbacks) {
    this.time = 0;
    this._isPlayerNear = false;
    this.scene = scene;
    this.callbacks = callbacks;

    // Three.js mesh — a stone plinth with a glowing flame crown
    const stoneGeometry = new THREE.CylinderGeometry(0.18, 0.22, 1.0, 8);
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x352e24,
      roughness: 0.92,
      metalness: 0.04
    });
    const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
    stone.castShadow = true;
    stone.receiveShadow = true;

    const bowlGeometry = new THREE.BoxGeometry(0.28, 0.12, 0.28);
    const bowlMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a5030,
      roughness: 0.7,
      metalness: 0.3
    });
    const bowl = new THREE.Mesh(bowlGeometry, bowlMaterial);
    bowl.position.y = 0.56;

    const flameGeometry = new THREE.BoxGeometry(0.14, 0.22, 0.14);
    const flameMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8c00,
      emissive: 0xff6000,
      emissiveIntensity: 2.5,
      roughness: 0.5
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.y = 0.73;

    // Warm point light — the Hearthlight's glow
    this.light = new THREE.PointLight(0xff9a28, 4, 9);
    this.light.position.y = 0.85;
    this.light.castShadow = false; // perf budget

    this.group = new THREE.Group();
    this.group.add(stone, bowl, flame, this.light);
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
    this.light.intensity = 3.8
      + Math.sin(this.time * FLICKER_SPEED * Math.PI * 2) * 0.6
      + Math.sin(this.time * FLICKER_SPEED * 2.7 * Math.PI * 2) * 0.25;

    // Proximity check
    const dx = playerWorldPos.x - this.group.position.x;
    const dz = playerWorldPos.z - this.group.position.z;
    const dist2 = dx * dx + dz * dz;
    this._isPlayerNear = dist2 <= INTERACT_RADIUS * INTERACT_RADIUS;

    if (this._isPlayerNear && interactJustPressed) {
      this.callbacks.onRest();
    }

    return this._isPlayerNear;
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  }
}
