import * as THREE from "three";

const COLLECT_RADIUS = 1.8;
const FLOAT_AMP = 0.18;
const FLOAT_SPEED = 1.4;

/**
 * EmberOrb — the dropped Embers marker.
 *
 * Spawned at the death position. Collected when the player moves within
 * COLLECT_RADIUS. Auto-destroyed if player dies again before collecting.
 */
export class EmberOrb {
  constructor(scene, position, amount) {
    this.time = 0;
    this._collected = false;
    this.scene = scene;
    this.amount = amount;
    this.origin = position.clone();

    const geometry = new THREE.SphereGeometry(0.22, 8, 6);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffa020,
      emissive: 0xff6000,
      emissiveIntensity: 2.2,
      roughness: 0.3
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.castShadow = false;

    this.light = new THREE.PointLight(0xff8020, 3, 4.5);
    this.light.position.copy(position);
    scene.add(this.mesh, this.light);
  }

  get collected() {
    return this._collected;
  }

  /**
   * Returns true if the orb was just collected this frame.
   */
  update(dt, playerPos) {
    if (this._collected) return false;

    this.time += dt;

    // Float up and down
    const y = this.origin.y + Math.sin(this.time * FLOAT_SPEED * Math.PI * 2) * FLOAT_AMP;
    this.mesh.position.y = y;
    this.light.position.y = y;

    // Slowly rotate
    this.mesh.rotation.y += dt * 1.2;

    // Proximity collect
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    const dy = playerPos.y - this.mesh.position.y;
    const dist2 = dx * dx + dy * dy + dz * dz;

    if (dist2 <= COLLECT_RADIUS * COLLECT_RADIUS) {
      this._collected = true;
      this.dispose();
      return true;
    }

    return false;
  }

  dispose() {
    this.scene.remove(this.mesh, this.light);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
