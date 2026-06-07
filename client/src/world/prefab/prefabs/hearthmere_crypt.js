import * as THREE from "three";
import { createBossArena } from "../../BossArena.js";
import { HEARTHMERE_BOSS_ARENA } from "../../regions/hearthmere/placements.js";

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

  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x504848,
    roughness: 0.96,
    metalness: 0.03
  });
  const darkDoorMaterial = new THREE.MeshStandardMaterial({
    color: 0x282020,
    roughness: 0.98,
    metalness: 0.05
  });
  const flagstoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x444040,
    roughness: 0.94,
    metalness: 0.02
  });
  const plinthMaterial = new THREE.MeshStandardMaterial({
    color: 0x3c3838,
    roughness: 0.97,
    metalness: 0.02
  });
  const markerMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e1414,
    roughness: 0.92,
    metalness: 0.06
  });

  // Flagstone floor — flat plane slightly above terrain
  const floorGeo = new THREE.PlaneGeometry(14, 10);
  const floor = new THREE.Mesh(floorGeo, flagstoneMaterial);
  floor.name = "crypt-flagstone-floor";
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.04, 2);
  floor.receiveShadow = true;
  group.add(floor);

  // Left pillar of doorframe — 1.5 × 7 × 1 box
  const pillarGeo = new THREE.BoxGeometry(1.5, 7, 1);

  const pillarLeft = new THREE.Mesh(pillarGeo, stoneMaterial);
  pillarLeft.name = "crypt-pillar-left";
  pillarLeft.position.set(-2.5, 3.5, 0);
  pillarLeft.castShadow = true;
  pillarLeft.receiveShadow = true;
  group.add(pillarLeft);

  const pillarRight = new THREE.Mesh(pillarGeo, stoneMaterial);
  pillarRight.name = "crypt-pillar-right";
  pillarRight.position.set(2.5, 3.5, 0);
  pillarRight.castShadow = true;
  pillarRight.receiveShadow = true;
  group.add(pillarRight);

  // Keystone arch blocks — 3 wedge-ish boxes forming a rough arch
  const archCentreGeo = new THREE.BoxGeometry(2.2, 1.2, 1.2);
  const archCentre = new THREE.Mesh(archCentreGeo, stoneMaterial);
  archCentre.name = "crypt-arch-keystone";
  archCentre.position.set(0, 7.6, 0);
  archCentre.castShadow = true;
  group.add(archCentre);

  const archLeftGeo = new THREE.BoxGeometry(1.5, 1.0, 1.1);
  const archLeft = new THREE.Mesh(archLeftGeo, stoneMaterial);
  archLeft.position.set(-1.75, 7.1, 0);
  archLeft.rotation.z = 0.25;
  archLeft.castShadow = true;
  group.add(archLeft);

  const archRightGeo = new THREE.BoxGeometry(1.5, 1.0, 1.1);
  const archRight = new THREE.Mesh(archRightGeo, stoneMaterial);
  archRight.position.set(1.75, 7.1, 0);
  archRight.rotation.z = -0.25;
  archRight.castShadow = true;
  group.add(archRight);

  // Heavy sealed door — 4u wide × 6u tall × 0.5u deep
  const doorGeo = new THREE.BoxGeometry(4, 6, 0.5);
  const sealedDoor = new THREE.Mesh(doorGeo, darkDoorMaterial);
  sealedDoor.name = "crypt-sealed-door";
  sealedDoor.position.set(0, 3, 0.1);
  sealedDoor.castShadow = true;
  group.add(sealedDoor);

  // Door detail — iron band strips (2 horizontal boxes across the door)
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x181010, roughness: 0.85, metalness: 0.3 });
  for (const bandY of [1.5, 4.5]) {
    const bandGeo = new THREE.BoxGeometry(4.1, 0.22, 0.55);
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, bandY, 0.08);
    group.add(band);
  }

  // Carved steps descending — 3 platforms, each slightly lower and further back
  const stepData = [
    { z: 2.5, y: -0.1, w: 9, d: 1.5 },
    { z: 4.0, y: -0.35, w: 9, d: 1.5 },
    { z: 5.5, y: -0.6, w: 9, d: 1.5 }
  ];
  for (const step of stepData) {
    const stepGeo = new THREE.BoxGeometry(step.w, 0.25, step.d);
    const stepMesh = new THREE.Mesh(stepGeo, flagstoneMaterial);
    stepMesh.position.set(0, step.y, step.z);
    stepMesh.receiveShadow = true;
    group.add(stepMesh);
  }

  // Skull/rune marker plinths — cylinder base flanking the door
  const plinthCylGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.9, 8);

  const plinthLeft = new THREE.Mesh(plinthCylGeo, plinthMaterial);
  plinthLeft.name = "crypt-plinth-left";
  plinthLeft.position.set(-5, 0.45, 0.5);
  plinthLeft.castShadow = true;
  group.add(plinthLeft);

  const plinthRight = new THREE.Mesh(plinthCylGeo, plinthMaterial);
  plinthRight.name = "crypt-plinth-right";
  plinthRight.position.set(5, 0.45, 0.5);
  plinthRight.castShadow = true;
  group.add(plinthRight);

  // Marker boxes on top of plinths — represent carved rune stones / skulls
  const markerGeo = new THREE.BoxGeometry(0.6, 0.6, 0.5);

  const markerLeft = new THREE.Mesh(markerGeo, markerMaterial);
  markerLeft.name = "crypt-marker-left";
  markerLeft.position.set(-5, 1.2, 0.5);
  markerLeft.rotation.y = 0.15;
  markerLeft.castShadow = true;
  group.add(markerLeft);

  const markerRight = new THREE.Mesh(markerGeo, markerMaterial);
  markerRight.name = "crypt-marker-right";
  markerRight.position.set(5, 1.2, 0.5);
  markerRight.rotation.y = -0.12;
  markerRight.castShadow = true;
  group.add(markerRight);

  // Flanking rubble — rough stone chunks leaning against pillars
  const rubbleData = [
    [-3.8, 0.25, -0.5, 0.8, 0.5, 0.6],
    [3.6, 0.2, -0.3, 0.7, 0.4, 0.55],
    [-4.5, 0.18, 1.2, 0.6, 0.35, 0.5],
    [4.2, 0.22, 1.0, 0.65, 0.4, 0.52]
  ];
  for (const [rx, ry, rz, rw, rh, rd] of rubbleData) {
    const rGeo = new THREE.BoxGeometry(rw, rh, rd);
    const rubble = new THREE.Mesh(rGeo, stoneMaterial);
    rubble.position.set(rx, ry, rz);
    rubble.rotation.y = rx * 0.22;
    rubble.castShadow = true;
    group.add(rubble);
  }

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
      bossArena?.update(dt, playerPosition, Boolean(runtime.playerHasIframes));
    },
    isPlayerNearInteractable() { return false; },
    dispose() {
      bossArena?.dispose();
      disposeGroup(scene, group);
      for (const body of bodies) {
        rapier?.world?.removeRigidBody(body);
      }
    }
  };
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

function disposeGroup(scene, group) {
  const geometries = new Set();
  const materials = new Set();
  scene.remove(group);
  group.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    if (Array.isArray(child.material)) {
      for (const mat of child.material) materials.add(mat);
    } else if (child.material) {
      materials.add(child.material);
    }
  });
  for (const geo of geometries) geo.dispose();
  for (const mat of materials) mat.dispose();
}
