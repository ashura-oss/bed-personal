import * as THREE from "three";

const TRIGGER_DEPTH = 1.2; // player must cross this Z threshold

/**
 * FogGate — the boss arena entrance.
 *
 * Two stone pillars flank a translucent red-mist plane.
 * Crossing the threshold fires `onCrossed` (once).
 */
export class FogGate {
  constructor(scene, position, onCrossed) {
    this.scene = scene;
    this.crossed = false;
    this.onCrossed = onCrossed;

    // Pillars
    const pillarGeometry = new THREE.BoxGeometry(0.4, 4, 0.4);
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x252015,
      roughness: 0.9
    });

    const leftPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    leftPillar.position.set(-2.2, 2, 0);
    leftPillar.castShadow = true;

    const rightPillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    rightPillar.position.set(2.2, 2, 0);
    rightPillar.castShadow = true;

    // Fog plane — semi-transparent red mist
    const fogGeometry = new THREE.PlaneGeometry(4.4, 4);
    const fogMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc1100,
      transparent: true,
      opacity: 0.35,
      side: THREE.FrontSide,
      depthWrite: false
    });

    const fogPlane = new THREE.Mesh(fogGeometry, fogMaterial);
    fogPlane.position.y = 2;

    this.group = new THREE.Group();
    this.group.add(leftPillar, rightPillar, fogPlane);
    this.group.position.set(position.x, position.y, position.z);
    scene.add(this.group);
    this.triggerZ = position.z - TRIGGER_DEPTH;
  }

  /** Returns true the frame the player crosses the threshold. */
  update(playerPos) {
    if (this.crossed) return false;

    if (playerPos.z <= this.triggerZ) {
      this.crossed = true;
      this.group.visible = false;
      this.onCrossed();
      return true;
    }

    return false;
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  }
}
