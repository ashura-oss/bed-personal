import * as THREE from "three";

export const HOLLOW_REACH_RUINS_PREFAB = Object.freeze({
  id: "hollow_reach_ruins",
  name: "Hollow's Reach Ruins",
  biomeId: "hearthmere",
  footprintRadius: 35,
  blendRadius: 10,
  build: buildHollowReachRuins
});

export function buildHollowReachRuins({ scene, rapier, origin }) {
  const group = new THREE.Group();
  group.name = HOLLOW_REACH_RUINS_PREFAB.id;
  group.position.set(origin.x, origin.y, origin.z);

  const darkTimberMaterial = new THREE.MeshStandardMaterial({
    color: 0x28200e,
    roughness: 0.95,
    metalness: 0.01
  });
  const darkStoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3530,
    roughness: 0.97,
    metalness: 0.02
  });
  const rottenTimberMaterial = new THREE.MeshStandardMaterial({
    color: 0x32280f,
    roughness: 0.98,
    metalness: 0.0
  });

  // Cart 1 — overturned on its side, angled
  const cart1Body = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 2.2), darkTimberMaterial);
  cart1Body.name = "hollow-cart-1";
  cart1Body.position.set(-4, 1.1, -3);
  cart1Body.rotation.z = Math.PI / 2 + 0.15;
  cart1Body.rotation.y = 0.4;
  cart1Body.castShadow = true;
  group.add(cart1Body);

  const cart1Side = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 0.8), darkTimberMaterial);
  cart1Side.position.set(-4, 1.5, -4);
  cart1Side.rotation.z = Math.PI / 2 + 0.15;
  cart1Side.rotation.y = 0.4;
  group.add(cart1Side);

  // Cart 2 — partially upright, leaning
  const cart2Body = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 2.2), darkTimberMaterial);
  cart2Body.name = "hollow-cart-2";
  cart2Body.position.set(5, 0.8, 2);
  cart2Body.rotation.z = 0.6;
  cart2Body.rotation.y = -0.3;
  cart2Body.castShadow = true;
  group.add(cart2Body);

  // Cart 3 — mostly flat, facing different direction
  const cart3Body = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 2.2), darkTimberMaterial);
  cart3Body.name = "hollow-cart-3";
  cart3Body.position.set(1, 0.15, 8);
  cart3Body.rotation.z = 0.1;
  cart3Body.rotation.y = 1.2;
  cart3Body.castShadow = true;
  group.add(cart3Body);

  // Broken wagon wheel — TorusGeometry lying flat
  const wheelRimGeo = new THREE.TorusGeometry(1.1, 0.12, 6, 14);
  const brokenWheel = new THREE.Mesh(wheelRimGeo, darkTimberMaterial);
  brokenWheel.name = "hollow-broken-wheel";
  brokenWheel.position.set(-8, 0.12, 4);
  brokenWheel.rotation.x = Math.PI / 2;
  brokenWheel.rotation.z = 0.18;
  brokenWheel.castShadow = true;
  group.add(brokenWheel);

  // Wheel spokes (3 box segments crossing centre)
  for (let i = 0; i < 3; i++) {
    const spokeGeo = new THREE.BoxGeometry(2.0, 0.08, 0.1);
    const spoke = new THREE.Mesh(spokeGeo, darkTimberMaterial);
    spoke.position.set(-8, 0.12, 4);
    spoke.rotation.y = (i * Math.PI) / 3;
    group.add(spoke);
  }

  // Collapsed palisade — 4 logs at various angles on the ground
  const logPositions = [
    { x: 3, z: -6, ry: 0.2, rz: 0.05 },
    { x: 6, z: -5, ry: 0.45, rz: 0.08 },
    { x: 7, z: -3, ry: 0.6, rz: 0.12 },
    { x: 4.5, z: -7, ry: 0.1, rz: 0.06 }
  ];
  const logGeo = new THREE.BoxGeometry(3.5, 0.5, 0.5);
  for (const pos of logPositions) {
    const log = new THREE.Mesh(logGeo, rottenTimberMaterial);
    log.position.set(pos.x, 0.25, pos.z);
    log.rotation.y = pos.ry;
    log.rotation.z = pos.rz;
    log.castShadow = true;
    group.add(log);
  }

  // Stone marker / obelisk — slightly off-vertical
  const obeliskGeo = new THREE.BoxGeometry(1, 6, 1);
  const obelisk = new THREE.Mesh(obeliskGeo, darkStoneMaterial);
  obelisk.name = "hollow-obelisk";
  obelisk.position.set(-1, 3, -9);
  obelisk.rotation.z = 0.07;
  obelisk.rotation.x = -0.04;
  obelisk.castShadow = true;
  group.add(obelisk);

  // Obelisk base block
  const obeliskBaseGeo = new THREE.BoxGeometry(1.8, 0.6, 1.8);
  const obeliskBase = new THREE.Mesh(obeliskBaseGeo, darkStoneMaterial);
  obeliskBase.position.set(-1, 0.3, -9);
  obeliskBase.castShadow = true;
  group.add(obeliskBase);

  // Scattered debris chunks — 8 small boxes
  const debrisData = [
    [2, 0.15, -2, 0.6, 0.3, 0.5],
    [-2, 0.12, 5, 0.5, 0.25, 0.45],
    [8, 0.1, -8, 0.4, 0.2, 0.35],
    [-9, 0.13, -4, 0.55, 0.28, 0.4],
    [0, 0.1, -4, 0.45, 0.22, 0.38],
    [6, 0.12, 6, 0.5, 0.25, 0.42],
    [-6, 0.11, 7, 0.38, 0.18, 0.32],
    [3, 0.13, 4, 0.52, 0.26, 0.44]
  ];
  for (const [dx, dy, dz, dw, dh, dd] of debrisData) {
    const dGeo = new THREE.BoxGeometry(dw, dh, dd);
    const debris = new THREE.Mesh(dGeo, darkStoneMaterial);
    debris.position.set(dx, dy, dz);
    debris.rotation.y = dx * 0.35;
    debris.castShadow = true;
    group.add(debris);
  }

  scene.add(group);

  const bodies = createStaticColliders(rapier, origin);

  const meshes = [];
  group.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });

  return {
    id: HOLLOW_REACH_RUINS_PREFAB.id,
    origin,
    group,
    meshes,
    bodies,
    update() {},
    isPlayerNearInteractable() { return false; },
    dispose() {
      disposeGroup(scene, group);
      for (const body of bodies) {
        rapier?.world?.removeRigidBody(body);
      }
    }
  };
}

function createStaticColliders(rapier, origin) {
  if (!rapier?.module || !rapier?.world) return [];

  const bodies = [];
  const specs = [
    // Cart frame 1
    { offset: { x: -4, y: 1.1, z: -3 }, half: { x: 3, y: 0.15, z: 1.1 } },
    // Cart frame 2
    { offset: { x: 5, y: 0.8, z: 2 }, half: { x: 3, y: 0.15, z: 1.1 } },
    // Cart frame 3
    { offset: { x: 1, y: 0.15, z: 8 }, half: { x: 3, y: 0.15, z: 1.1 } },
    // Obelisk
    { offset: { x: -1, y: 3, z: -9 }, half: { x: 0.5, y: 3, z: 0.5 } }
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
