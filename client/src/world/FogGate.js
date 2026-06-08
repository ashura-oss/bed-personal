import * as THREE from "three";
import { addMesh, createArtTracker, makeMaterialSet } from "./art/HearthmereArtKit.js";

const TRIGGER_DEPTH = 1.2; // player must cross this Z threshold
const GATE_WIDTH = 4.8;
const GATE_HEIGHT = 4.2;

function createFogGateVisual() {
  const tracker = createArtTracker();
  const materials = makeMaterialSet(tracker, {
    ash: 0x3a3430,
    soot: 0x151111,
    mud: 0x2b211d,
    iron: 0x4f5354,
    tarnishedIron: 0x383c3d,
    wound: 0xb32618,
    ember: 0xff4d16,
    emberGold: 0xffa45a,
    focusBlue: 0x72cfc7,
  });
  const mistMaterial = tracker.material({
    color: 0xc93a20,
    emissive: 0x8f170d,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.86,
    metalness: 0.0,
  });
  const deepMistMaterial = tracker.material({
    color: 0x5f1518,
    emissive: 0x3a0708,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.95,
    metalness: 0.0,
  });
  const group = new THREE.Group();
  group.name = "hearthmere-fog-gate";

  const blockGeo = new THREE.BoxGeometry(0.72, 0.52, 0.82);
  tracker.trackGeometry(blockGeo);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i += 1) {
      addMesh(group, tracker, blockGeo.clone(), i % 3 === 0 ? materials.ash : materials.mud, {
        position: [side * 2.55, 0.25 + i * 0.48, (i % 2) * 0.06],
        rotation: [0, side * 0.04, side * (i % 2 === 0 ? 0.035 : -0.02)],
        scale: [1 + (i % 2) * 0.1, 1, 1],
        name: "stacked-crypt-gate-pillar-stone",
      });
    }
  }

  const capGeo = new THREE.BoxGeometry(1.04, 0.42, 1.02);
  addMesh(group, tracker, capGeo, materials.soot, {
    position: [-2.55, GATE_HEIGHT - 0.3, 0],
    rotation: [0, 0.08, -0.035],
    name: "left-fog-gate-capstone",
  });
  addMesh(group, tracker, capGeo.clone(), materials.soot, {
    position: [2.55, GATE_HEIGHT - 0.3, 0],
    rotation: [0, -0.08, 0.035],
    name: "right-fog-gate-capstone",
  });

  const lintelGeo = new THREE.BoxGeometry(GATE_WIDTH, 0.44, 0.72);
  addMesh(group, tracker, lintelGeo, materials.ash, {
    position: [0, GATE_HEIGHT - 0.02, 0],
    rotation: [0, 0, 0.01],
    name: "cracked-crypt-gate-lintel",
  });

  const archStoneGeo = new THREE.BoxGeometry(0.58, 0.5, 0.62);
  tracker.trackGeometry(archStoneGeo);
  for (let i = 0; i < 7; i += 1) {
    const t = i / 6;
    const x = -1.8 + t * 3.6;
    const y = 3.34 + Math.sin(t * Math.PI) * 0.38;
    addMesh(group, tracker, archStoneGeo.clone(), i === 3 ? materials.soot : materials.ash, {
      position: [x, y, -0.02],
      rotation: [0, 0, (t - 0.5) * -0.5],
      name: "uneven-fog-gate-arch-stone",
    });
  }

  const fogGeo = new THREE.PlaneGeometry(4.5, 3.45, 1, 1);
  addMesh(group, tracker, fogGeo, mistMaterial, {
    position: [0, 2.02, 0.035],
    name: "red-boss-gate-mist-front",
    castShadow: false,
    receiveShadow: false,
  });
  addMesh(group, tracker, fogGeo.clone(), deepMistMaterial, {
    position: [0, 2.04, -0.09],
    rotation: [0, 0, 0.035],
    scale: [0.9, 1.04, 1],
    name: "red-boss-gate-mist-depth",
    castShadow: false,
    receiveShadow: false,
  });

  const runeGeo = new THREE.BoxGeometry(0.12, 0.42, 0.035);
  tracker.trackGeometry(runeGeo);
  for (let i = 0; i < 8; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    addMesh(group, tracker, runeGeo.clone(), row % 2 === 0 ? materials.ember : materials.focus, {
      position: [side * 2.08, 0.88 + row * 0.72, 0.44],
      rotation: [0, 0, side * (0.25 + row * 0.1)],
      receiveShadow: false,
      castShadow: false,
      name: "lit-fog-gate-binding-rune",
    });
  }

  const chainGeo = new THREE.TorusGeometry(0.18, 0.025, 5, 10);
  tracker.trackGeometry(chainGeo);
  for (let i = 0; i < 6; i += 1) {
    addMesh(group, tracker, chainGeo.clone(), materials.tarnishedIron, {
      position: [-1.25 + i * 0.5, 3.12 - Math.abs(i - 2.5) * 0.05, 0.42],
      rotation: [Math.PI / 2, 0, i % 2 === 0 ? Math.PI / 2 : 0],
      scale: [1, 0.7, 1],
      name: "sagging-fog-gate-chain-link",
    });
  }

  const emberGeo = new THREE.SphereGeometry(0.08, 8, 6);
  tracker.trackGeometry(emberGeo);
  for (const x of [-2.12, 2.12]) {
    addMesh(group, tracker, emberGeo.clone(), materials.ember, {
      position: [x, 3.48, 0.45],
      receiveShadow: false,
      castShadow: false,
      name: "gate-rune-ember-pin",
    });
  }

  return { group, tracker };
}

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

    const visual = createFogGateVisual();
    this.group = visual.group;
    this.tracker = visual.tracker;
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

  /**
   * Externally seal the gate (hide visuals, mark as crossed).
   * Called by BossArena when distance-based activation fires so the
   * existing Z-axis trigger is bypassed — backward-compatible: the
   * normal update() path still works if onCrossed is wired instead.
   */
  seal() {
    if (this.crossed) return;
    this.crossed = true;
    this.group.visible = false;
  }

  dispose() {
    this.scene.remove(this.group);
    this.tracker.dispose();
  }
}
