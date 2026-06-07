import * as THREE from "three";

export const ASHFALL_ROAD_GATE_PREFAB = Object.freeze({
  id: "ashfall_road_gate",
  name: "Ashfall Road Gate",
  biomeId: "hearthmere",
  footprintRadius: 40,
  blendRadius: 10,
  build: buildAshfallRoadGate
});

export function buildAshfallRoadGate({ scene, rapier, origin }) {
  const group = new THREE.Group();
  group.name = ASHFALL_ROAD_GATE_PREFAB.id;
  group.position.set(origin.x, origin.y, origin.z);

  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b6460,
    roughness: 0.95,
    metalness: 0.02
  });
  const darkStoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4440,
    roughness: 0.97,
    metalness: 0.01
  });
  const sconceMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3530,
    roughness: 0.9,
    metalness: 0.08
  });

  // Left pillar — positioned at x=-6 (half of 12u gap)
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), stoneMaterial);
  leftPillar.name = "gate-pillar-left";
  leftPillar.position.set(-6, 4, 0);
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  group.add(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), stoneMaterial);
  rightPillar.name = "gate-pillar-right";
  rightPillar.position.set(6, 4, 0);
  rightPillar.castShadow = true;
  rightPillar.receiveShadow = true;
  group.add(rightPillar);

  // Crumbling cap blocks on top of each pillar (slightly shifted for ruin look)
  const capGeoL = new THREE.BoxGeometry(2.4, 0.6, 2.4);
  const capLeft = new THREE.Mesh(capGeoL, darkStoneMaterial);
  capLeft.position.set(-6.1, 8.3, 0.1);
  capLeft.rotation.y = 0.07;
  capLeft.castShadow = true;
  group.add(capLeft);

  const capGeoR = new THREE.BoxGeometry(2.2, 0.5, 2.2);
  const capRight = new THREE.Mesh(capGeoR, darkStoneMaterial);
  capRight.position.set(6.05, 8.25, -0.08);
  capRight.rotation.y = -0.05;
  capRight.castShadow = true;
  group.add(capRight);

  // Fallen crossbeam lying on the ground — rotated along X, 14u long
  const beamGeo = new THREE.BoxGeometry(14, 0.8, 0.8);
  const fallenBeam = new THREE.Mesh(beamGeo, darkStoneMaterial);
  fallenBeam.name = "gate-fallen-crossbeam";
  fallenBeam.position.set(0, 0.4, 1.6);
  fallenBeam.rotation.z = 0.04;  // slight tilt for organic feel
  fallenBeam.castShadow = true;
  fallenBeam.receiveShadow = true;
  group.add(fallenBeam);

  // Broken beam fragment — smaller piece further from centre
  const fragmentGeo = new THREE.BoxGeometry(3.5, 0.7, 0.7);
  const beamFragment = new THREE.Mesh(fragmentGeo, darkStoneMaterial);
  beamFragment.position.set(4.5, 0.35, -0.8);
  beamFragment.rotation.y = 0.3;
  beamFragment.rotation.z = 0.12;
  beamFragment.castShadow = true;
  group.add(beamFragment);

  // Torch sconce on left pillar (cylinder bracket + small box holder)
  const sconceBaseGeoL = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
  const sconceBaseL = new THREE.Mesh(sconceBaseGeoL, sconceMaterial);
  sconceBaseL.position.set(-4.96, 6.5, 0);
  sconceBaseL.rotation.z = Math.PI / 2;
  group.add(sconceBaseL);

  const sconceCupGeoL = new THREE.CylinderGeometry(0.18, 0.14, 0.28, 8);
  const sconceCupL = new THREE.Mesh(sconceCupGeoL, sconceMaterial);
  sconceCupL.position.set(-4.3, 6.5, 0);
  group.add(sconceCupL);

  // Torch sconce on right pillar
  const sconceBaseGeoR = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
  const sconceBaseR = new THREE.Mesh(sconceBaseGeoR, sconceMaterial);
  sconceBaseR.position.set(4.96, 6.5, 0);
  sconceBaseR.rotation.z = Math.PI / 2;
  group.add(sconceBaseR);

  const sconceCupGeoR = new THREE.CylinderGeometry(0.18, 0.14, 0.28, 8);
  const sconceCupR = new THREE.Mesh(sconceCupGeoR, sconceMaterial);
  sconceCupR.position.set(4.3, 6.5, 0);
  group.add(sconceCupR);

  // Rubble blocks scattered around base
  const rubblePositions = [
    [-5.5, 0.25, 2.2, 0.9, 0.5, 0.7],
    [5.2, 0.2, -1.8, 0.7, 0.4, 0.6],
    [-7.0, 0.18, -1.2, 0.6, 0.35, 0.5],
    [7.3, 0.22, 1.5, 0.8, 0.45, 0.55]
  ];
  for (const [rx, ry, rz, rw, rh, rd] of rubblePositions) {
    const rGeo = new THREE.BoxGeometry(rw, rh, rd);
    const rubble = new THREE.Mesh(rGeo, stoneMaterial);
    rubble.position.set(rx, ry, rz);
    rubble.rotation.y = rx * 0.4;
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
    id: ASHFALL_ROAD_GATE_PREFAB.id,
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
    // Left pillar
    { offset: { x: -6, y: 4, z: 0 }, half: { x: 1, y: 4, z: 1 } },
    // Right pillar
    { offset: { x: 6, y: 4, z: 0 }, half: { x: 1, y: 4, z: 1 } },
    // Fallen crossbeam
    { offset: { x: 0, y: 0.4, z: 1.6 }, half: { x: 7, y: 0.4, z: 0.4 } }
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
