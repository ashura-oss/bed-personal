import * as THREE from "three";
import { Hearthlight } from "../../Hearthlight.js";
import {
  HEARTHMERE_PALETTE,
  addMesh,
  createArtTracker,
  makeMaterialSet
} from "../../art/HearthmereArtKit.js";

export const HEARTHMERE_CAMP_PREFAB = Object.freeze({
  id: "hearthmere_camp",
  name: "Hearthmere Road Camp",
  biomeId: "hearthmere",
  footprintRadius: 24,
  blendRadius: 8,
  hearthlightOffset: Object.freeze({ x: -4, z: 2 }),
  roadOffset: Object.freeze({ x: 0, z: -3 }),
  build: buildHearthmereCamp
});

export function buildHearthmereCamp({ scene, rapier, origin, callbacks = {} }) {
  const group = new THREE.Group();
  group.name = HEARTHMERE_CAMP_PREFAB.id;
  group.position.set(origin.x, origin.y, origin.z);

  const tracker = createArtTracker();
  const materials = makeCampMaterials(tracker);

  addMuddyOutpostGround(group, tracker, materials);
  addVariedPalisade(group, tracker, materials);
  addCartWreckage(group, tracker, materials);
  addFieldForge(group, tracker, materials);
  addSupplyStacks(group, tracker, materials);
  addCampBanners(group, tracker, materials);
  addAshAndEmbers(group, tracker, materials);

  const fireGlow = new THREE.PointLight(HEARTHMERE_PALETTE.ember, 1.25, 11);
  fireGlow.name = "hearthmere-camp-forge-glow";
  fireGlow.position.set(-1.8, 1.2, 4.8);
  group.add(fireGlow);

  scene.add(group);

  const hearthlight = new Hearthlight(
    scene,
    {
      x: origin.x + HEARTHMERE_CAMP_PREFAB.hearthlightOffset.x,
      y: origin.y,
      z: origin.z + HEARTHMERE_CAMP_PREFAB.hearthlightOffset.z
    },
    {
      onRest: callbacks.onHearthlightRest ?? (() => {})
    }
  );

  const colliderBodies = createStaticColliders(rapier, origin);

  return {
    id: HEARTHMERE_CAMP_PREFAB.id,
    origin,
    group,
    hearthlights: Object.freeze([hearthlight]),
    update(dt, playerPosition, interactJustPressed) {
      hearthlight.update(dt, playerPosition, interactJustPressed);
    },
    isPlayerNearInteractable() {
      return hearthlight.isPlayerNear;
    },
    dispose() {
      hearthlight.dispose();
      scene.remove(group);
      tracker.dispose();

      for (const body of colliderBodies) {
        rapier?.world?.removeRigidBody(body);
      }
    }
  };
}

function makeCampMaterials(tracker) {
  const base = makeMaterialSet(tracker, {
    mud: 0x372b22,
    oldWood: 0x3a2618,
    cutWood: 0x765634,
    cloth: 0x3b2525,
    ash: 0x50483d,
    soot: 0x17120f,
    iron: 0x3f4444,
    tarnishedIron: 0x2b3030
  });

  return {
    ...base,
    road: tracker.material({ color: 0x5b513f, roughness: 0.98, metalness: 0.0 }),
    churnedMud: tracker.material({ color: 0x2d251e, roughness: 1.0, metalness: 0.0 }),
    wetMud: tracker.material({
      color: 0x1f1b18,
      roughness: 0.42,
      metalness: 0.0,
      transparent: true,
      opacity: 0.72
    }),
    emberCoal: tracker.material({
      color: 0x1d1210,
      emissive: HEARTHMERE_PALETTE.ember,
      emissiveIntensity: 1.05,
      roughness: 0.72,
      metalness: 0.02
    }),
    bannerTrim: tracker.material({
      color: 0x8a2f22,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.DoubleSide
    }),
    clothDoubleSide: tracker.material({
      color: 0x2f3438,
      roughness: 0.97,
      metalness: 0.01,
      side: THREE.DoubleSide
    })
  };
}

function addMuddyOutpostGround(group, tracker, materials) {
  addMesh(group, tracker, new THREE.CircleGeometry(13, 64), materials.mud, {
    position: [0, 0.035, 0],
    rotation: [-Math.PI / 2, 0, 0],
    scale: [1.15, 0.86, 1],
    receiveShadow: true,
    castShadow: false,
    name: "hearthmere-camp-muddy-fortified-pad"
  });

  addMesh(group, tracker, new THREE.BoxGeometry(25.5, 0.05, 5.8), materials.road, {
    position: [0, 0.065, -3],
    receiveShadow: true,
    castShadow: false,
    name: "ashfall-road-rutted-caravan-segment"
  });

  const rutGeo = new THREE.BoxGeometry(10.8, 0.025, 0.18);
  for (const [x, z, rot, scale] of [
    [-5.8, -4.25, -0.03, 1],
    [5.4, -4.1, 0.04, 0.92],
    [-4.8, -1.9, 0.05, 0.78],
    [4.2, -1.75, -0.04, 0.88]
  ]) {
    addMesh(group, tracker, rutGeo.clone(), materials.churnedMud, {
      position: [x, 0.105, z],
      rotation: [0, rot, 0],
      scale: [scale, 1, 1],
      receiveShadow: true,
      castShadow: false,
      name: "caravan-wheel-mud-rut"
    });
  }

  const puddleGeo = new THREE.CircleGeometry(0.55, 18);
  for (const [x, z, sx, sz] of [
    [-6.1, -2.2, 1.25, 0.5],
    [3.4, -4.45, 0.9, 0.42],
    [0.2, 1.3, 0.68, 0.34]
  ]) {
    addMesh(group, tracker, puddleGeo.clone(), materials.wetMud, {
      position: [x, 0.11, z],
      rotation: [-Math.PI / 2, 0, x * 0.11],
      scale: [sx, sz, 1],
      receiveShadow: false,
      castShadow: false,
      name: "dark-water-mud-puddle"
    });
  }

  const patchGeo = new THREE.CircleGeometry(1.2, 12);
  for (const [x, z, scale, rot] of [
    [-3.8, 4.3, [1.1, 0.42, 1], 0.6],
    [4.5, 4.1, [0.88, 0.32, 1], -0.4],
    [-7.5, 0.2, [0.7, 0.28, 1], 0.1],
    [7.8, -0.6, [0.75, 0.3, 1], -0.3]
  ]) {
    addMesh(group, tracker, patchGeo.clone(), materials.ash, {
      position: [x, 0.085, z],
      rotation: [-Math.PI / 2, 0, rot],
      scale,
      castShadow: false,
      name: "trampled-ash-ground-patch"
    });
  }
}

function addVariedPalisade(group, tracker, materials) {
  const stakeGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.55, 6);
  const spikeGeo = new THREE.ConeGeometry(0.13, 0.38, 6);
  const positions = [
    [-8.5, 5.0, 1.02, -0.12],
    [-7.3, 5.8, 0.88, 0.08],
    [-6.0, 6.35, 1.14, -0.05],
    [-4.6, 6.75, 0.96, 0.12],
    [4.9, 6.35, 1.08, -0.1],
    [6.4, 5.8, 0.93, 0.04],
    [7.8, 4.85, 1.18, 0.1],
    [-8.9, -4.65, 1.0, 0.08],
    [-7.5, -5.55, 0.86, -0.12],
    [-5.8, -6.05, 1.1, 0.04],
    [6.5, -5.45, 0.98, -0.08],
    [8.0, -4.35, 1.12, 0.12],
    [8.8, -2.95, 0.92, -0.04]
  ];

  for (const [x, z, heightScale, lean] of positions) {
    const height = 1.55 * heightScale;
    addMesh(group, tracker, stakeGeo.clone(), materials.wood, {
      position: [x, height * 0.5, z],
      rotation: [lean * 0.5, (x + z) * 0.015, lean],
      scale: [1, heightScale, 1],
      name: "jagged-caravan-palisade-stake"
    });
    addMesh(group, tracker, spikeGeo.clone(), materials.cutWood, {
      position: [x, height + 0.18, z],
      rotation: [lean * 0.5, 0, lean],
      name: "splintered-palisade-spike"
    });
  }

  const railGeo = new THREE.BoxGeometry(3.1, 0.16, 0.18);
  for (const [x, y, z, rot] of [
    [-6.6, 0.85, 6.2, -0.28],
    [6.2, 0.95, 5.7, 0.32],
    [-7.4, 0.78, -5.35, 0.35],
    [7.4, 0.86, -4.6, -0.45]
  ]) {
    addMesh(group, tracker, railGeo.clone(), materials.wood, {
      position: [x, y, z],
      rotation: [0.04, rot, 0.08],
      name: "lashed-palisade-crossrail"
    });
  }
}

function addCartWreckage(group, tracker, materials) {
  addMesh(group, tracker, new THREE.BoxGeometry(2.35, 0.26, 1.22), materials.wood, {
    position: [4.6, 0.34, 2.6],
    rotation: [0.08, -0.24, -0.06],
    name: "broken-caravan-bed"
  });
  addMesh(group, tracker, new THREE.BoxGeometry(1.9, 0.1, 0.16), materials.cutWood, {
    position: [4.1, 0.62, 3.12],
    rotation: [0.1, -0.42, 0.22],
    name: "splintered-cart-sideboard"
  });
  addMesh(group, tracker, new THREE.BoxGeometry(1.6, 0.1, 0.14), materials.cutWood, {
    position: [5.3, 0.56, 2.02],
    rotation: [-0.16, -0.58, -0.2],
    name: "collapsed-cart-sideboard"
  });

  addMesh(group, tracker, new THREE.CylinderGeometry(0.08, 0.08, 1.85, 8), materials.wood, {
    position: [4.6, 0.28, 2.6],
    rotation: [0, 0, Math.PI / 2],
    name: "broken-cart-axle"
  });

  for (const [side, tilt, zOffset] of [
    [-1, -0.28, -0.08],
    [1, 0.16, 0.12]
  ]) {
    addMesh(group, tracker, new THREE.TorusGeometry(0.34, 0.045, 7, 14), materials.wood, {
      position: [4.6 + side * 0.96, 0.3, 2.6 + zOffset],
      rotation: [tilt, Math.PI / 2, 0],
      name: "mud-caked-cart-wheel"
    });
    addMesh(group, tracker, new THREE.CylinderGeometry(0.035, 0.035, 0.58, 6), materials.wood, {
      position: [4.6 + side * 0.96, 0.3, 2.6 + zOffset],
      rotation: [Math.PI / 2, 0, tilt],
      name: "cart-wheel-spoke"
    });
  }

  const plankGeo = new THREE.BoxGeometry(0.14, 0.12, 1.1);
  for (const [x, z, rot] of [
    [3.55, 1.85, 0.7],
    [5.55, 3.4, -0.9],
    [4.25, 3.65, 0.25]
  ]) {
    addMesh(group, tracker, plankGeo.clone(), materials.cutWood, {
      position: [x, 0.15, z],
      rotation: [0.12, rot, 0.18],
      name: "scattered-cart-plank"
    });
  }
}

function addFieldForge(group, tracker, materials) {
  addMesh(group, tracker, new THREE.BoxGeometry(1.55, 0.42, 1.05), materials.ash, {
    position: [-1.5, 0.23, 5.0],
    rotation: [0, 0.08, 0],
    name: "hearthmere-field-forge-stone-base"
  });
  addMesh(group, tracker, new THREE.BoxGeometry(1.0, 0.12, 0.58), materials.emberCoal, {
    position: [-1.5, 0.52, 5.0],
    rotation: [0, 0.08, 0],
    castShadow: false,
    receiveShadow: false,
    name: "field-forge-glowing-coal-bed"
  });
  addMesh(group, tracker, new THREE.BoxGeometry(0.36, 1.15, 0.36), materials.ash, {
    position: [-2.08, 0.84, 5.26],
    rotation: [0.03, -0.08, -0.06],
    name: "field-forge-cracked-chimney"
  });
  addMesh(group, tracker, new THREE.BoxGeometry(0.8, 0.18, 0.34), materials.tarnishedIron, {
    position: [-0.35, 0.62, 4.72],
    rotation: [0, -0.36, 0],
    name: "portable-forge-anvil"
  });
  addMesh(group, tracker, new THREE.CylinderGeometry(0.08, 0.06, 0.75, 7), materials.wood, {
    position: [-0.02, 0.47, 5.25],
    rotation: [1.25, 0.2, -0.5],
    name: "forge-hammer-handle"
  });
  addMesh(group, tracker, new THREE.BoxGeometry(0.28, 0.16, 0.18), materials.iron, {
    position: [0.25, 0.62, 5.08],
    rotation: [0.12, -0.52, 0.08],
    name: "forge-hammer-head"
  });
}

function addSupplyStacks(group, tracker, materials) {
  const crateGeo = new THREE.BoxGeometry(0.72, 0.55, 0.72);
  const cratePositions = [
    [2.2, 0.28, 5.1, 0.28],
    [2.95, 0.28, 5.0, -0.12],
    [2.55, 0.84, 5.05, 0.4],
    [3.5, 0.28, 4.38, -0.38],
    [1.65, 0.28, 4.4, 0.08]
  ];

  for (const [x, y, z, ry] of cratePositions) {
    addMesh(group, tracker, crateGeo.clone(), materials.wood, {
      position: [x, y, z],
      rotation: [0, ry, 0],
      name: "camp-supply-crate"
    });
    addMesh(group, tracker, new THREE.BoxGeometry(0.78, 0.08, 0.08), materials.cutWood, {
      position: [x, y + 0.1, z + 0.38],
      rotation: [0, ry, 0],
      name: "crate-brace-slat"
    });
  }

  const barrelGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.78, 12);
  for (const [x, z, ry] of [
    [1.25, 5.45, 0.12],
    [3.85, 5.18, -0.18],
    [2.0, 3.85, 0.42]
  ]) {
    addMesh(group, tracker, barrelGeo.clone(), materials.wood, {
      position: [x, 0.39, z],
      rotation: [0, ry, 0],
      name: "camp-tarred-supply-barrel"
    });
    for (const y of [0.16, 0.62]) {
      addMesh(group, tracker, new THREE.CylinderGeometry(0.39, 0.39, 0.045, 12), materials.tarnishedIron, {
        position: [x, y, z],
        rotation: [0, ry, 0],
        name: "barrel-iron-hoop"
      });
    }
  }
}

function addCampBanners(group, tracker, materials) {
  const poleGeo = new THREE.CylinderGeometry(0.055, 0.075, 2.2, 7);
  const clothGeo = new THREE.PlaneGeometry(0.78, 1.1, 1, 2);

  for (const [x, z, ry, clothMaterial] of [
    [-6.25, 6.35, 0.25, materials.bannerTrim],
    [7.25, -4.65, -0.4, materials.clothDoubleSide]
  ]) {
    addMesh(group, tracker, poleGeo.clone(), materials.wood, {
      position: [x, 1.1, z],
      rotation: [0.04, ry, 0.08],
      name: "weathered-banner-pole"
    });
    addMesh(group, tracker, clothGeo.clone(), clothMaterial, {
      position: [x + 0.32, 1.58, z],
      rotation: [0.08, ry, -0.08],
      castShadow: true,
      receiveShadow: false,
      name: "torn-hearthmere-camp-banner"
    });
    addMesh(group, tracker, new THREE.BoxGeometry(0.08, 0.92, 0.025), materials.soot, {
      position: [x + 0.32, 1.53, z + 0.01],
      rotation: [0.08, ry, -0.08],
      castShadow: false,
      receiveShadow: false,
      name: "banner-charred-tear"
    });
  }
}

function addAshAndEmbers(group, tracker, materials) {
  const coalGeo = new THREE.DodecahedronGeometry(0.08, 0);
  for (const [x, z, s] of [
    [-1.9, 4.5, 1],
    [-1.2, 5.35, 0.8],
    [-2.35, 5.15, 0.65],
    [-0.9, 4.65, 0.55],
    [4.85, 2.0, 0.45]
  ]) {
    addMesh(group, tracker, coalGeo.clone(), materials.emberCoal, {
      position: [x, 0.16, z],
      rotation: [0.2, x, z],
      scale: [s, s * 0.65, s],
      castShadow: false,
      receiveShadow: false,
      name: "camp-live-ember-coal"
    });
  }

  const boneGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.62, 6);
  for (const [x, z, rot] of [
    [-5.1, 2.3, 0.8],
    [5.7, -1.1, -0.4]
  ]) {
    addMesh(group, tracker, boneGeo.clone(), materials.bone, {
      position: [x, 0.13, z],
      rotation: [Math.PI / 2, 0.15, rot],
      name: "picked-clean-roadside-bone"
    });
  }
}

function createStaticColliders(rapier, origin) {
  if (!rapier?.module || !rapier?.world) return [];

  const bodies = [];
  const colliderSpecs = [
    { offset: { x: 4.6, y: 0.34, z: 2.6 }, halfExtents: { x: 1.1, y: 0.2, z: 0.6 } },
    { offset: { x: -1.5, y: 0.3, z: 5.0 }, halfExtents: { x: 0.75, y: 0.3, z: 0.55 } },
    { offset: { x: 2.6, y: 0.45, z: 5.05 }, halfExtents: { x: 1.0, y: 0.45, z: 0.45 } }
  ];

  for (const spec of colliderSpecs) {
    const bodyDesc = rapier.module.RigidBodyDesc.fixed().setTranslation(
      origin.x + spec.offset.x,
      origin.y + spec.offset.y,
      origin.z + spec.offset.z
    );
    const body = rapier.world.createRigidBody(bodyDesc);
    const colliderDesc = rapier.module.ColliderDesc.cuboid(
      spec.halfExtents.x,
      spec.halfExtents.y,
      spec.halfExtents.z
    );
    rapier.world.createCollider(colliderDesc, body);
    bodies.push(body);
  }

  return bodies;
}
