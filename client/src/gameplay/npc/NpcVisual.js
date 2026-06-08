import * as THREE from "three";
import {
  addMesh,
  createArtTracker,
  HEARTHMERE_PALETTE,
  makeMaterialSet
} from "../../world/art/HearthmereArtKit.js";

/**
 * NpcVisual - generated Hearthmere role silhouette for a single NPC.
 *
 * Owns all Three.js objects. Delegates all logic to the injected NpcController.
 * A small floating cone marker above the head signals "talk to me".
 * setHighlighted(true) scales/brightens the marker when the player is in range.
 */

const BODY_HEIGHT = 1.9;
const MARKER_Y = BODY_HEIGHT + 0.52;
const MARKER_BASE_SCALE = 1.0;
const MARKER_HIGHLIGHT_SCALE = 1.35;

const MARKER_COLOR_DEFAULT = 0xffdd88;
const MARKER_COLOR_HIGHLIGHTED = 0xffffff;

const ROLE_ALIASES = Object.freeze({
  blacksmith: "blacksmith",
  guard: "guard",
  trader: "trader",
  wanderer: "wanderer",
  scout: "scout",
  survivor: "survivor",
  miner: "miner",
  traveller: "traveller",
  traveler: "traveller"
});

export class NpcVisual {
  #scene;
  #npc;
  #group;
  #tracker;
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
    this.#tracker = createArtTracker();
    this.#markerBobTime = 0;
    this.#highlighted = false;

    this.#group = new THREE.Group();
    this.#group.name = `npc-${npc.definition?.role ?? "traveller"}-visual`;

    const materials = makeNpcMaterialSet(this.#tracker, npc.definition?.color);
    buildRoleSilhouette(this.#group, this.#tracker, materials, npc.definition?.role);
    this.#createMarker();

    scene.add(this.#group);

    // Sync immediately to avoid a one-frame pop.
    this._syncTransform();
  }

  // Public API

  /**
   * Call every frame after npc.update() has run.
   *
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    this._syncTransform();

    // Gently bob the marker up and down.
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
    this.#tracker.dispose();
  }

  // Private

  #createMarker() {
    const markerGeo = new THREE.ConeGeometry(0.12, 0.28, 6);
    this.#markerMaterial = this.#tracker.material({
      color: MARKER_COLOR_DEFAULT,
      roughness: 0.4,
      metalness: 0.1,
      emissive: new THREE.Color(MARKER_COLOR_DEFAULT),
      emissiveIntensity: 0.3
    });
    this.#markerMesh = addMesh(this.#group, this.#tracker, markerGeo, this.#markerMaterial, {
      position: [0, MARKER_Y, 0],
      castShadow: false,
      receiveShadow: false,
      name: "talk-marker"
    });
  }

  _syncTransform() {
    const p = this.#npc.position;
    this.#group.position.set(p.x, p.y, p.z);
    this.#group.rotation.y = this.#npc.facingAngle;
  }
}

function makeNpcMaterialSet(tracker, npcColor) {
  const base = makeMaterialSet(tracker);
  const roleColor = typeof npcColor === "number" ? npcColor : HEARTHMERE_PALETTE.cloth;

  return {
    ...base,
    role: tracker.material({ color: roleColor, roughness: 0.88, metalness: 0.04 }),
    skin: tracker.material({ color: 0xb28a68, roughness: 0.82, metalness: 0.02 }),
    leather: tracker.material({ color: 0x3a2418, roughness: 0.9, metalness: 0.03 }),
    bandage: tracker.material({ color: 0xc7bea2, roughness: 0.86, metalness: 0.01 }),
    gold: tracker.material({
      color: 0xd6a13c,
      emissive: 0x5a3108,
      emissiveIntensity: 0.12,
      roughness: 0.42,
      metalness: 0.45
    })
  };
}

function buildRoleSilhouette(root, tracker, materials, roleName) {
  const body = new THREE.Group();
  body.name = "npc-role-silhouette";
  root.add(body);

  buildHumanoid(body, tracker, materials);

  switch (normalizeRole(roleName)) {
    case "blacksmith":
      buildBlacksmith(body, tracker, materials);
      break;
    case "guard":
      buildGuard(body, tracker, materials);
      break;
    case "trader":
      buildTrader(body, tracker, materials);
      break;
    case "scout":
      buildScout(body, tracker, materials);
      break;
    case "survivor":
      buildSurvivor(body, tracker, materials);
      break;
    case "miner":
      buildMiner(body, tracker, materials);
      break;
    case "wanderer":
      buildWanderer(body, tracker, materials);
      break;
    case "traveller":
    default:
      buildTraveller(body, tracker, materials);
      break;
  }
}

function normalizeRole(roleName) {
  return ROLE_ALIASES[String(roleName ?? "").toLowerCase()] ?? "traveller";
}

function buildHumanoid(root, tracker, materials) {
  const bootGeo = new THREE.BoxGeometry(0.18, 0.12, 0.34);
  addMesh(root, tracker, bootGeo, materials.leather, {
    position: [-0.14, 0.06, 0.02],
    name: "left-boot"
  });
  addMesh(root, tracker, bootGeo.clone(), materials.leather, {
    position: [0.14, 0.06, 0.02],
    name: "right-boot"
  });

  const legGeo = new THREE.CylinderGeometry(0.07, 0.085, 0.62, 7);
  addMesh(root, tracker, legGeo, materials.cloth, {
    position: [-0.13, 0.43, 0],
    rotation: [0.05, 0, 0.04],
    name: "left-leg"
  });
  addMesh(root, tracker, legGeo.clone(), materials.cloth, {
    position: [0.13, 0.43, 0],
    rotation: [-0.03, 0, -0.04],
    name: "right-leg"
  });

  const torsoGeo = new THREE.CylinderGeometry(0.26, 0.32, 0.74, 8);
  addMesh(root, tracker, torsoGeo, materials.role, {
    position: [0, 1.03, 0],
    scale: [0.92, 1, 0.72],
    name: "role-colored-torso"
  });

  const beltGeo = new THREE.BoxGeometry(0.62, 0.07, 0.12);
  addMesh(root, tracker, beltGeo, materials.leather, {
    position: [0, 0.78, 0.21],
    name: "front-belt"
  });

  const shoulderGeo = new THREE.BoxGeometry(0.68, 0.13, 0.32);
  addMesh(root, tracker, shoulderGeo, materials.cloth, {
    position: [0, 1.38, 0],
    name: "ash-cloth-shoulders"
  });

  const headGeo = new THREE.SphereGeometry(0.19, 12, 8);
  addMesh(root, tracker, headGeo, materials.skin, {
    position: [0, 1.69, 0],
    scale: [0.92, 1.05, 0.9],
    name: "head"
  });

  const noseGeo = new THREE.ConeGeometry(0.035, 0.09, 5);
  addMesh(root, tracker, noseGeo, materials.skin, {
    position: [0, 1.68, 0.18],
    rotation: [Math.PI * 0.5, 0, 0],
    receiveShadow: false,
    name: "face-direction-nose"
  });

  const armGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.58, 7);
  addMesh(root, tracker, armGeo, materials.role, {
    position: [-0.4, 1.08, 0.01],
    rotation: [0.16, 0, 0.22],
    name: "left-arm"
  });
  addMesh(root, tracker, armGeo.clone(), materials.role, {
    position: [0.4, 1.08, 0.01],
    rotation: [0.16, 0, -0.22],
    name: "right-arm"
  });

  const handGeo = new THREE.SphereGeometry(0.07, 8, 6);
  addMesh(root, tracker, handGeo, materials.skin, {
    position: [-0.47, 0.79, 0.08],
    scale: [0.85, 0.85, 0.85],
    name: "left-hand"
  });
  addMesh(root, tracker, handGeo.clone(), materials.skin, {
    position: [0.47, 0.79, 0.08],
    scale: [0.85, 0.85, 0.85],
    name: "right-hand"
  });
}

function buildBlacksmith(root, tracker, materials) {
  addMesh(root, tracker, new THREE.BoxGeometry(0.42, 0.58, 0.06), materials.leather, {
    position: [0, 0.98, 0.24],
    name: "blacksmith-leather-apron"
  });
  addMesh(root, tracker, new THREE.BoxGeometry(0.22, 0.08, 0.08), materials.iron, {
    position: [0.58, 0.72, 0.13],
    rotation: [0.1, 0.16, -0.3],
    name: "blacksmith-hammer-head"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.025, 0.03, 0.42, 6), materials.wood, {
    position: [0.47, 0.9, 0.1],
    rotation: [0.2, 0, -0.45],
    name: "blacksmith-hammer-handle"
  });
  addMesh(root, tracker, new THREE.SphereGeometry(0.07, 8, 6), materials.ember, {
    position: [-0.45, 0.84, 0.17],
    scale: [0.75, 0.75, 0.75],
    receiveShadow: false,
    name: "blacksmith-ember-tongs-glow"
  });
}

function buildGuard(root, tracker, materials) {
  addMesh(root, tracker, new THREE.ConeGeometry(0.23, 0.22, 8), materials.tarnishedIron, {
    position: [0, 1.9, 0],
    name: "guard-iron-helmet"
  });
  addMesh(root, tracker, new THREE.BoxGeometry(0.08, 0.58, 0.035), materials.iron, {
    position: [0, 1.12, 0.25],
    name: "guard-chest-plate"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.18, 0.2, 0.06, 8), materials.tarnishedIron, {
    position: [-0.5, 1.05, 0.12],
    rotation: [Math.PI * 0.5, 0, 0.14],
    name: "guard-round-shield"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.018, 0.024, 1.28, 6), materials.wood, {
    position: [0.54, 1.2, 0.05],
    rotation: [0.1, 0, -0.1],
    name: "guard-spear-shaft"
  });
  addMesh(root, tracker, new THREE.ConeGeometry(0.055, 0.2, 6), materials.iron, {
    position: [0.63, 1.86, 0.03],
    rotation: [0.1, 0, -0.1],
    name: "guard-spear-tip"
  });
}

function buildTrader(root, tracker, materials) {
  addMesh(root, tracker, new THREE.BoxGeometry(0.48, 0.36, 0.16), materials.cutWood, {
    position: [0, 0.92, 0.31],
    name: "trader-front-crate"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.035, 0.035, 0.76, 7), materials.wood, {
    position: [0, 1.32, 0.34],
    rotation: [Math.PI * 0.5, 0, Math.PI * 0.5],
    name: "trader-carrying-pole"
  });
  for (const x of [-0.24, 0, 0.24]) {
    addMesh(root, tracker, new THREE.SphereGeometry(0.045, 8, 6), materials.gold, {
      position: [x, 1.12, 0.43],
      receiveShadow: false,
      name: "trader-hanging-token"
    });
  }
  addMesh(root, tracker, new THREE.BoxGeometry(0.28, 0.32, 0.2), materials.leather, {
    position: [-0.36, 0.98, -0.16],
    rotation: [0, -0.18, 0],
    name: "trader-side-satchel"
  });
}

function buildWanderer(root, tracker, materials) {
  addMesh(root, tracker, new THREE.ConeGeometry(0.34, 1.02, 8, 1, true), materials.cloth, {
    position: [0, 1.15, -0.08],
    scale: [1, 1, 0.58],
    name: "wanderer-ragged-cloak"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.022, 0.03, 1.34, 6), materials.wood, {
    position: [0.55, 0.88, 0.1],
    rotation: [0.2, 0, -0.08],
    name: "wanderer-walking-staff"
  });
  addMesh(root, tracker, new THREE.SphereGeometry(0.13, 8, 6), materials.bandage, {
    position: [-0.32, 1.22, -0.2],
    scale: [1.15, 0.72, 0.9],
    name: "wanderer-shoulder-bundle"
  });
}

function buildScout(root, tracker, materials) {
  addMesh(root, tracker, new THREE.ConeGeometry(0.24, 0.26, 8, 1, true), materials.cloth, {
    position: [0, 1.8, -0.01],
    scale: [1, 0.78, 0.88],
    name: "scout-low-hood"
  });
  addMesh(root, tracker, new THREE.TorusGeometry(0.28, 0.018, 6, 18, Math.PI * 1.25), materials.wood, {
    position: [-0.48, 1.08, 0.03],
    rotation: [0.2, -0.48, 0.15],
    name: "scout-short-bow"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.055, 0.07, 0.48, 7), materials.leather, {
    position: [0.28, 1.26, -0.22],
    rotation: [0.45, 0.22, -0.35],
    name: "scout-quiver"
  });
  for (const x of [0.23, 0.28, 0.33]) {
    addMesh(root, tracker, new THREE.CylinderGeometry(0.007, 0.009, 0.44, 5), materials.cutWood, {
      position: [x, 1.42, -0.24],
      rotation: [0.48, 0.22, -0.35],
      name: "scout-arrow"
    });
  }
}

function buildSurvivor(root, tracker, materials) {
  addMesh(root, tracker, new THREE.BoxGeometry(0.5, 0.11, 0.05), materials.bandage, {
    position: [0, 1.15, 0.24],
    rotation: [0, 0, -0.3],
    name: "survivor-chest-bandage"
  });
  addMesh(root, tracker, new THREE.BoxGeometry(0.23, 0.2, 0.045), materials.bandage, {
    position: [-0.14, 1.69, 0.18],
    rotation: [0.05, 0, 0.18],
    name: "survivor-face-wrap"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.12, 0.12, 0.46, 8), materials.cloth, {
    position: [0.33, 0.96, -0.2],
    rotation: [Math.PI * 0.5, 0.15, 0.12],
    name: "survivor-rolled-bedroll"
  });
  addMesh(root, tracker, new THREE.BoxGeometry(0.18, 0.18, 0.045), materials.wound, {
    position: [0.18, 1.28, 0.24],
    rotation: [0, 0, 0.25],
    name: "survivor-red-cloth-patch"
  });
}

function buildMiner(root, tracker, materials) {
  addMesh(root, tracker, new THREE.CylinderGeometry(0.2, 0.22, 0.12, 8), materials.tarnishedIron, {
    position: [0, 1.84, 0],
    name: "miner-cap"
  });
  addMesh(root, tracker, new THREE.SphereGeometry(0.055, 8, 6), materials.ember, {
    position: [0, 1.85, 0.2],
    scale: [1, 0.75, 0.72],
    receiveShadow: false,
    name: "miner-cap-lamp"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.02, 0.026, 0.76, 6), materials.wood, {
    position: [0.48, 1.04, 0.07],
    rotation: [0.1, 0, -0.56],
    name: "miner-pick-handle"
  });
  addMesh(root, tracker, new THREE.TorusGeometry(0.17, 0.018, 6, 16, Math.PI), materials.iron, {
    position: [0.62, 1.29, 0.06],
    rotation: [0, Math.PI * 0.5, 0.35],
    name: "miner-pick-head"
  });
  addMesh(root, tracker, new THREE.BoxGeometry(0.2, 0.28, 0.14), materials.iron, {
    position: [-0.36, 0.92, -0.16],
    rotation: [0, 0.2, 0],
    name: "miner-ore-pouch"
  });
}

function buildTraveller(root, tracker, materials) {
  addMesh(root, tracker, new THREE.BoxGeometry(0.42, 0.5, 0.18), materials.leather, {
    position: [0, 1.06, -0.25],
    name: "traveller-backpack"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.1, 0.1, 0.48, 8), materials.bandage, {
    position: [0, 1.38, -0.34],
    rotation: [Math.PI * 0.5, 0, Math.PI * 0.5],
    name: "traveller-bedroll"
  });
  addMesh(root, tracker, new THREE.CylinderGeometry(0.02, 0.028, 1.1, 6), materials.wood, {
    position: [-0.52, 0.88, 0.08],
    rotation: [0.16, 0, 0.08],
    name: "traveller-walking-stick"
  });
}
