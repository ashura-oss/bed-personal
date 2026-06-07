import * as THREE from "three";

export const COPPERSTONE_MINE_PREFAB = Object.freeze({
  id: "copperstone_mine",
  name: "Copperstone Mine",
  biomeId: "hearthmere",
  footprintRadius: 30,
  blendRadius: 8,
  build: buildCopperstoneMine
});

export function buildCopperstoneMine({ scene, rapier, origin }) {
  const group = new THREE.Group();
  group.name = COPPERSTONE_MINE_PREFAB.id;
  group.position.set(origin.x, origin.y, origin.z);

  const timberMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3018,
    roughness: 0.92,
    metalness: 0.02
  });
  const darkPitMaterial = new THREE.MeshStandardMaterial({
    color: 0x181410,
    roughness: 1.0,
    metalness: 0.0
  });
  const oreMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a5c38,
    roughness: 0.85,
    metalness: 0.18
  });
  const ironOreMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c6a3a,
    roughness: 0.8,
    metalness: 0.22
  });
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a4020,
    roughness: 0.88,
    metalness: 0.01
  });

  // Mine entrance frame — two vertical support beams
  const beamGeo = new THREE.BoxGeometry(1, 5, 1);

  const beamLeft = new THREE.Mesh(beamGeo, timberMaterial);
  beamLeft.name = "mine-beam-left";
  beamLeft.position.set(-2, 2.5, 0);
  beamLeft.castShadow = true;
  group.add(beamLeft);

  const beamRight = new THREE.Mesh(beamGeo, timberMaterial);
  beamRight.name = "mine-beam-right";
  beamRight.position.set(2, 2.5, 0);
  beamRight.castShadow = true;
  group.add(beamRight);

  // Lintel across the top
  const lintelGeo = new THREE.BoxGeometry(5, 0.8, 1);
  const lintel = new THREE.Mesh(lintelGeo, timberMaterial);
  lintel.name = "mine-lintel";
  lintel.position.set(0, 5.4, 0);
  lintel.castShadow = true;
  group.add(lintel);

  // Cross brace — diagonal support for ruined look
  const braceGeo = new THREE.BoxGeometry(0.5, 3.6, 0.5);
  const brace = new THREE.Mesh(braceGeo, timberMaterial);
  brace.position.set(-1.2, 2.8, 0.4);
  brace.rotation.z = 0.4;
  brace.castShadow = true;
  group.add(brace);

  // Dark pit indicator — flat plane slightly below ground level inside entrance
  const pitGeo = new THREE.PlaneGeometry(3.5, 3.5);
  const pit = new THREE.Mesh(pitGeo, darkPitMaterial);
  pit.name = "mine-pit";
  pit.rotation.x = -Math.PI / 2;
  pit.position.set(0, -0.05, -2.5);
  group.add(pit);

  // Hill mound backing — suggests a hillside (large flattened box behind entrance)
  const hillGeo = new THREE.BoxGeometry(10, 5, 4);
  const hillMaterial = new THREE.MeshStandardMaterial({
    color: 0x3c3228,
    roughness: 0.99,
    metalness: 0.0
  });
  const hill = new THREE.Mesh(hillGeo, hillMaterial);
  hill.name = "mine-hill-backing";
  hill.position.set(0, 2.5, -4);
  hill.receiveShadow = true;
  group.add(hill);

  // Ore cart body
  const cartBodyGeo = new THREE.BoxGeometry(1.6, 0.9, 0.9);
  const cartBody = new THREE.Mesh(cartBodyGeo, woodMaterial);
  cartBody.name = "mine-ore-cart";
  cartBody.position.set(-4, 0.65, 1.5);
  cartBody.rotation.y = 0.3;
  cartBody.castShadow = true;
  group.add(cartBody);

  // Ore cart wheels (visual only — 4 small cylinders)
  const wheelPositions = [
    [-3.3, -1.4], [-3.3, 1.4], [-4.7, -1.4], [-4.7, 1.4]
  ];
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 8);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9 });
  for (const [wx, wz] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(wx, 0.28, wz + 1.5);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
  }

  // Scattered ore chunks near entrance — mix of sphere-ish and angular
  const orePositions = [
    [1.5, 2.2, 0.35],
    [2.8, 1.4, 0.28],
    [-1.2, 3.0, 0.3],
    [0.4, 3.5, 0.22],
    [-3.0, 2.8, 0.25]
  ];
  for (let i = 0; i < orePositions.length; i++) {
    const [ox, oz, oy] = orePositions[i];
    const useIron = i % 2 === 0;
    const oreGeo = new THREE.SphereGeometry(0.22 + (i % 3) * 0.06, 6, 5);
    const ore = new THREE.Mesh(oreGeo, useIron ? ironOreMaterial : oreMaterial);
    ore.position.set(ox, oy, oz);
    ore.scale.set(1.0, 0.65, 0.9);
    ore.castShadow = true;
    group.add(ore);
  }

  // Ground scatter — loose stones
  const stoneGeo = new THREE.BoxGeometry(0.4, 0.2, 0.35);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5c5448, roughness: 0.96 });
  const stonePositions = [
    [3.5, 3.2], [-5.0, 0.8], [4.0, -0.5], [-2.5, 4.0]
  ];
  for (const [sx, sz] of stonePositions) {
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(sx, 0.1, sz);
    stone.rotation.y = sx * 0.7;
    group.add(stone);
  }

  scene.add(group);

  const bodies = createStaticColliders(rapier, origin);

  const meshes = [];
  group.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });

  return {
    id: COPPERSTONE_MINE_PREFAB.id,
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
    // Left support beam
    { offset: { x: -2, y: 2.5, z: 0 }, half: { x: 0.5, y: 2.5, z: 0.5 } },
    // Right support beam
    { offset: { x: 2, y: 2.5, z: 0 }, half: { x: 0.5, y: 2.5, z: 0.5 } }
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
