import * as THREE from "three";
import { createBossArena } from "../../BossArena.js";
import { HEARTHMERE_BOSS_ARENA } from "../../regions/hearthmere/placements.js";
import {
  HEARTHMERE_PALETTE,
  addMesh,
  createArtTracker,
  makeMaterialSet
} from "../../art/HearthmereArtKit.js";

export const HEARTHMERE_CRYPT_PREFAB = Object.freeze({
  id: "hearthmere_crypt",
  name: "Hearthmere Crypt",
  biomeId: "hearthmere",
  footprintRadius: 52,
  blendRadius: 8,
  bossEncounter: HEARTHMERE_BOSS_ARENA,
  build: buildHearthmere_crypt
});

export function buildHearthmere_crypt({ scene, rapier, origin, callbacks = {}, anchor = null }) {
  const group = new THREE.Group();
  group.name = HEARTHMERE_CRYPT_PREFAB.id;
  group.position.set(origin.x, origin.y, origin.z);
  const bossEncounter = resolveEncounterDefinition(
    anchor?.bossEncounter ?? HEARTHMERE_CRYPT_PREFAB.bossEncounter,
    origin
  );
  const bossArena = createCryptBossArena({
    scene,
    rapier,
    origin,
    callbacks,
    definition: bossEncounter
  });

  const tracker = createArtTracker();
  const materials = makeCryptMaterials(tracker);
  addCryptFlagstoneApproach(group, tracker, materials);
  addSealedCryptFacade(group, tracker, materials);
  addCryptRunePlinths(group, tracker, materials);
  addCryptRubbleAndWorldheart(group, tracker, materials);

  scene.add(group);

  const bodies = createStaticColliders(rapier, origin);

  const meshes = [];
  group.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });

  return {
    id: HEARTHMERE_CRYPT_PREFAB.id,
    origin,
    group,
    meshes,
    bodies,
    bossEncounter,
    bossArenas: bossArena ? [bossArena] : [],
    update(dt, playerPosition, _interactJustPressed, runtime = {}) {
      if (runtime.controlLocked && bossArena?.active) return;

      bossArena?.update(dt, playerPosition, Boolean(runtime.playerHasIframes));
    },
    isPlayerNearInteractable() { return false; },
    dispose() {
      bossArena?.dispose();
      scene.remove(group);
      tracker.dispose();
      for (const body of bodies) {
        rapier?.world?.removeRigidBody(body);
      }
    }
  };
}

function makeCryptMaterials(tracker) {
  const base = makeMaterialSet(tracker, {
    ash: 0x4e4943,
    soot: 0x151111,
    mud: 0x2a2422,
    cloth: 0x27282d,
    bone: 0xc9bfa7,
    iron: 0x26292b,
    tarnishedIron: 0x3c4242,
    ember: HEARTHMERE_PALETTE.ember,
    emberGold: HEARTHMERE_PALETTE.emberGold,
    focusBlue: 0x6fd2cc
  });

  return {
    ...base,
    cryptStone: tracker.material({ color: 0x504848, roughness: 0.97, metalness: 0.03 }),
    darkDoor: tracker.material({ color: 0x221b1b, roughness: 0.98, metalness: 0.05 }),
    flagstone: tracker.material({ color: 0x444040, roughness: 0.95, metalness: 0.02 }),
    plinth: tracker.material({ color: 0x3c3838, roughness: 0.97, metalness: 0.02 }),
    runeGlow: tracker.material({
      color: HEARTHMERE_PALETTE.emberGold,
      emissive: HEARTHMERE_PALETTE.ember,
      emissiveIntensity: 1.25,
      roughness: 0.38,
      metalness: 0.04
    }),
    worldheartGlow: tracker.material({
      color: 0x84e7dc,
      emissive: 0x74d6cc,
      emissiveIntensity: 0.95,
      roughness: 0.32,
      metalness: 0.08
    })
  };
}

function addCryptFlagstoneApproach(group, tracker, materials) {
  addMesh(group, tracker, new THREE.PlaneGeometry(15, 10.5), materials.flagstone, {
    position: [0, 0.035, 2.1],
    rotation: [-Math.PI / 2, 0, 0],
    receiveShadow: true,
    castShadow: false,
    name: "crypt-flagstone-floor"
  });

  const slabGeo = new THREE.BoxGeometry(1.6, 0.08, 1.15);
  const slabs = [
    [-5.4, 1.95, 0.9, -0.06],
    [-3.5, 2.1, 1.05, 0.04],
    [-1.55, 2.0, 0.92, -0.03],
    [0.55, 2.12, 1.12, 0.02],
    [2.65, 1.95, 0.86, 0.06],
    [4.85, 2.05, 1.0, -0.08],
    [-4.6, 3.75, 0.72, 0.12],
    [-2.3, 3.95, 1.0, -0.1],
    [0.0, 3.85, 0.82, 0.04],
    [2.15, 4.1, 1.08, 0.08],
    [4.45, 3.8, 0.78, -0.12]
  ];

  for (const [x, z, scale, rot] of slabs) {
    addMesh(group, tracker, slabGeo.clone(), materials.flagstone, {
      position: [x, 0.09, z],
      rotation: [0, rot, 0],
      scale: [scale, 1, 0.82 + scale * 0.15],
      receiveShadow: true,
      castShadow: false,
      name: "broken-crypt-flagstone"
    });
  }

  const stepData = [
    { z: 2.5, y: -0.1, w: 9.2, d: 1.5 },
    { z: 4.0, y: -0.35, w: 9.0, d: 1.5 },
    { z: 5.5, y: -0.6, w: 8.8, d: 1.5 }
  ];

  for (const step of stepData) {
    addMesh(group, tracker, new THREE.BoxGeometry(step.w, 0.25, step.d), materials.flagstone, {
      position: [0, step.y, step.z],
      receiveShadow: true,
      castShadow: false,
      name: "crypt-descending-carved-step"
    });
  }

  const crackGeo = new THREE.BoxGeometry(0.05, 0.025, 1.15);
  for (const [x, z, rot] of [
    [-3.4, 0.78, 0.35],
    [-0.45, 2.95, -0.25],
    [2.85, 1.1, 0.12],
    [4.8, 4.25, -0.4]
  ]) {
    addMesh(group, tracker, crackGeo.clone(), materials.soot, {
      position: [x, 0.13, z],
      rotation: [0, rot, 0],
      castShadow: false,
      receiveShadow: false,
      name: "crypt-flagstone-black-crack"
    });
  }
}

function addSealedCryptFacade(group, tracker, materials) {
  addMesh(group, tracker, new THREE.BoxGeometry(1.5, 7, 1), materials.cryptStone, {
    position: [-2.5, 3.5, 0],
    name: "crypt-pillar-left"
  });
  addMesh(group, tracker, new THREE.BoxGeometry(1.5, 7, 1), materials.cryptStone, {
    position: [2.5, 3.5, 0],
    name: "crypt-pillar-right"
  });

  const pillarChipGeo = new THREE.BoxGeometry(0.4, 0.18, 0.08);
  for (const [x, y, side, rot] of [
    [-3.26, 2.1, -1, -0.12],
    [-3.26, 4.9, -1, 0.16],
    [3.26, 1.6, 1, 0.1],
    [3.26, 5.4, 1, -0.18]
  ]) {
    addMesh(group, tracker, pillarChipGeo.clone(), materials.soot, {
      position: [x, y, 0.54],
      rotation: [0, 0, rot * side],
      castShadow: false,
      receiveShadow: false,
      name: "chiseled-pillar-shadow-cut"
    });
  }

  const archBlocks = [
    [0, 7.6, 0, 2.25, 1.2, 1.2, 0],
    [-1.75, 7.1, 0, 1.5, 1.0, 1.1, 0.25],
    [1.75, 7.1, 0, 1.5, 1.0, 1.1, -0.25],
    [-2.8, 6.45, 0, 1.0, 0.8, 1.0, 0.48],
    [2.8, 6.45, 0, 1.0, 0.8, 1.0, -0.48]
  ];

  for (const [x, y, z, w, h, d, rz] of archBlocks) {
    addMesh(group, tracker, new THREE.BoxGeometry(w, h, d), materials.cryptStone, {
      position: [x, y, z],
      rotation: [0, 0, rz],
      name: x === 0 ? "crypt-arch-keystone" : "crypt-arch-voussoir-stone"
    });
  }

  addMesh(group, tracker, new THREE.BoxGeometry(4, 6, 0.5), materials.darkDoor, {
    position: [0, 3, 0.1],
    name: "crypt-sealed-door"
  });

  for (const [x, name] of [
    [-1.08, "left-carved-door-slab"],
    [0, "center-carved-door-slab"],
    [1.08, "right-carved-door-slab"]
  ]) {
    addMesh(group, tracker, new THREE.BoxGeometry(0.72, 5.55, 0.08), materials.soot, {
      position: [x, 3, 0.39],
      castShadow: false,
      receiveShadow: false,
      name
    });
  }

  for (const bandY of [1.5, 3.02, 4.5]) {
    addMesh(group, tracker, new THREE.BoxGeometry(4.18, 0.22, 0.58), materials.iron, {
      position: [0, bandY, 0.05],
      name: "crypt-door-black-iron-band"
    });
  }

  addMesh(group, tracker, new THREE.CylinderGeometry(0.34, 0.42, 0.14, 10), materials.runeGlow, {
    position: [0, 3.02, 0.48],
    rotation: [Math.PI / 2, 0, 0],
    castShadow: false,
    receiveShadow: false,
    name: "sealed-door-worldheart-ember-sigil"
  });

  const runeGeo = new THREE.BoxGeometry(0.045, 0.42, 0.035);
  for (const [x, y, rz] of [
    [-1.55, 2.35, -0.28],
    [-0.85, 4.02, 0.22],
    [0.9, 2.18, -0.14],
    [1.48, 4.0, 0.3],
    [0, 5.2, 0]
  ]) {
    addMesh(group, tracker, runeGeo.clone(), materials.runeGlow, {
      position: [x, y, 0.48],
      rotation: [0, 0, rz],
      castShadow: false,
      receiveShadow: false,
      name: "crypt-door-glowing-rune-cut"
    });
  }
}

function addCryptRunePlinths(group, tracker, materials) {
  for (const [x, side, ry] of [
    [-5, -1, 0.15],
    [5, 1, -0.12]
  ]) {
    addMesh(group, tracker, new THREE.CylinderGeometry(0.42, 0.55, 0.9, 8), materials.plinth, {
      position: [x, 0.45, 0.5],
      rotation: [0, ry, 0],
      name: side < 0 ? "crypt-plinth-left" : "crypt-plinth-right"
    });
    addMesh(group, tracker, new THREE.BoxGeometry(0.72, 0.42, 0.5), materials.cryptStone, {
      position: [x, 1.05, 0.5],
      rotation: [0, ry, 0],
      name: "crypt-rune-plinth-capstone"
    });
    addMesh(group, tracker, new THREE.BoxGeometry(0.04, 0.32, 0.035), materials.runeGlow, {
      position: [x + side * 0.12, 1.08, 0.78],
      rotation: [0.2, 0, side * 0.28],
      castShadow: false,
      receiveShadow: false,
      name: "plinth-active-rune-mark"
    });

    addCryptSkull(group, tracker, materials, {
      x: x - side * 0.12,
      y: 1.42,
      z: 0.46,
      rotationY: ry + side * 0.28,
      name: side < 0 ? "crypt-skull-marker-left" : "crypt-skull-marker-right"
    });
  }
}

function addCryptSkull(group, tracker, materials, { x, y, z, rotationY, name }) {
  addMesh(group, tracker, new THREE.SphereGeometry(0.24, 10, 8), materials.bone, {
    position: [x, y, z],
    rotation: [0.08, rotationY, 0],
    scale: [0.82, 1, 0.72],
    name
  });
  for (const eyeX of [-0.075, 0.075]) {
    addMesh(group, tracker, new THREE.BoxGeometry(0.05, 0.05, 0.025), materials.soot, {
      position: [x + eyeX, y + 0.03, z + 0.18],
      rotation: [0, rotationY, 0],
      castShadow: false,
      receiveShadow: false,
      name: "crypt-skull-hollow-eye"
    });
  }
  addMesh(group, tracker, new THREE.BoxGeometry(0.18, 0.08, 0.05), materials.bone, {
    position: [x, y - 0.22, z + 0.03],
    rotation: [0, rotationY, 0],
    scale: [0.82, 1, 0.72],
    name: "crypt-skull-jawbone"
  });
}

function addCryptRubbleAndWorldheart(group, tracker, materials) {
  const rubbleData = [
    [-3.8, 0.25, -0.5, 0.8, 0.5, 0.6, -0.5],
    [3.6, 0.2, -0.3, 0.7, 0.4, 0.55, 0.42],
    [-4.5, 0.18, 1.2, 0.6, 0.35, 0.5, 0.2],
    [4.2, 0.22, 1.0, 0.65, 0.4, 0.52, -0.3],
    [-5.7, 0.16, 2.2, 0.5, 0.32, 0.46, 0.8],
    [5.55, 0.14, 2.35, 0.48, 0.28, 0.42, -0.75]
  ];

  for (const [rx, ry, rz, rw, rh, rd, rot] of rubbleData) {
    addMesh(group, tracker, new THREE.BoxGeometry(rw, rh, rd), materials.cryptStone, {
      position: [rx, ry, rz],
      rotation: [0.08, rot, -0.06],
      name: "crypt-leaning-rubble-block"
    });
  }

  const shardGeo = new THREE.ConeGeometry(0.12, 0.55, 5);
  for (const [x, y, z, scale, material, name] of [
    [-0.72, 0.26, 1.05, 0.72, materials.runeGlow, "worldheart-ember-shard"],
    [0.82, 0.22, 1.35, 0.58, materials.worldheartGlow, "worldheart-focus-shard"],
    [0.15, 0.2, 0.72, 0.46, materials.runeGlow, "worldheart-ember-shard"]
  ]) {
    addMesh(group, tracker, shardGeo.clone(), material, {
      position: [x, y, z],
      rotation: [0.42, x * 0.6, z * 0.4],
      scale: [scale, scale, scale],
      castShadow: false,
      receiveShadow: false,
      name
    });
  }

  const emberGeo = new THREE.DodecahedronGeometry(0.07, 0);
  for (const [x, z, s] of [
    [-1.2, 1.75, 0.8],
    [1.15, 1.9, 0.65],
    [-4.8, 0.95, 0.55],
    [4.65, 0.9, 0.52]
  ]) {
    addMesh(group, tracker, emberGeo.clone(), materials.runeGlow, {
      position: [x, 0.15, z],
      rotation: [0.2, x, z],
      scale: [s, s * 0.65, s],
      castShadow: false,
      receiveShadow: false,
      name: "crypt-smoldering-ember-detail"
    });
  }
}

function createCryptBossArena({ scene, rapier, origin, callbacks, definition }) {
  if (!definition || isBossDefeated(callbacks, definition.id)) {
    return null;
  }

  const createArena = typeof callbacks.createBossArena === "function"
    ? callbacks.createBossArena
    : createBossArena;
  const groundAt = createGroundSampler(callbacks, origin);

  return createArena({
    scene,
    rapier,
    definition,
    groundAt,
    callbacks: withBossEncounterIdentity(callbacks.bossArenaCallbacks ?? {}, definition)
  });
}

function withBossEncounterIdentity(callbacks, definition) {
  return {
    ...callbacks,
    onEntered(payload = {}) {
      callbacks.onEntered?.({
        id: definition.id,
        bossId: definition.id,
        encounterId: definition.encounterId,
        arenaId: definition.id,
        name: definition.bossName,
        bossName: definition.bossName,
        ...payload
      });
    },
    onBossDied(emberReward, payload = {}) {
      callbacks.onBossDied?.(emberReward, {
        id: definition.id,
        bossId: definition.id,
        encounterId: definition.encounterId,
        arenaId: definition.id,
        name: definition.bossName,
        bossName: definition.bossName,
        ...payload
      });
    }
  };
}

function createGroundSampler(callbacks, origin) {
  const sampler = callbacks.groundAt ?? callbacks.heightAt;

  if (typeof sampler === "function") {
    return sampler;
  }

  return () => origin.y;
}

function isBossDefeated(callbacks, bossId) {
  if (!bossId) return false;

  if (typeof callbacks.isBossDefeated === "function") {
    return callbacks.isBossDefeated(bossId) === true;
  }

  if (typeof callbacks.bossState?.isBossDefeated === "function") {
    return callbacks.bossState.isBossDefeated(bossId) === true;
  }

  if (typeof callbacks.bossState?.isDefeated === "function") {
    return callbacks.bossState.isDefeated(bossId) === true;
  }

  return false;
}

function resolveEncounterDefinition(encounter, origin) {
  if (!encounter || typeof encounter !== "object") return null;

  return Object.freeze({
    ...encounter,
    center: Object.freeze(resolveWorldPoint(origin, encounter.centerOffset, encounter.center)),
    gatePosition: Object.freeze(resolveWorldPoint(origin, encounter.gateOffset, encounter.gatePosition))
  });
}

function resolveWorldPoint(origin, offset, fallback) {
  const offsetX = Number(offset?.x);
  const offsetZ = Number(offset?.z);

  if (Number.isFinite(offsetX) && Number.isFinite(offsetZ)) {
    return {
      x: origin.x + offsetX,
      z: origin.z + offsetZ
    };
  }

  return {
    x: Number(fallback?.x),
    z: Number(fallback?.z)
  };
}

function createStaticColliders(rapier, origin) {
  if (!rapier?.module || !rapier?.world) return [];

  const bodies = [];
  const specs = [
    // Left pillar
    { offset: { x: -2.5, y: 3.5, z: 0 }, half: { x: 0.75, y: 3.5, z: 0.5 } },
    // Right pillar
    { offset: { x: 2.5, y: 3.5, z: 0 }, half: { x: 0.75, y: 3.5, z: 0.5 } },
    // Sealed door
    { offset: { x: 0, y: 3, z: 0.1 }, half: { x: 2, y: 3, z: 0.25 } }
  ];

  for (const spec of specs) {
    const bodyDesc = rapier.module.RigidBodyDesc.fixed().setTranslation(
      origin.x + spec.offset.x,
      origin.y + spec.offset.y,
      origin.z + spec.offset.z
    );
    const body = rapier.world.createRigidBody(bodyDesc);
    const colliderDesc = rapier.module.ColliderDesc.cuboid(
      spec.half.x, spec.half.y, spec.half.z
    );
    rapier.world.createCollider(colliderDesc, body);
    bodies.push(body);
  }

  return bodies;
}
