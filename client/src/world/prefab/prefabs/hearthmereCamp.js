import * as THREE from "three";
import { Hearthlight } from "../../Hearthlight.js";

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

  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f3629,
    roughness: 0.98,
    metalness: 0.0
  });
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x5b513f,
    roughness: 0.96,
    metalness: 0.0
  });
  const timberMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2618,
    roughness: 0.9,
    metalness: 0.02
  });
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d463c,
    roughness: 0.94,
    metalness: 0.04
  });
  const emberMaterial = new THREE.MeshStandardMaterial({
    color: 0xb76a32,
    emissive: 0x7a2a10,
    emissiveIntensity: 0.9,
    roughness: 0.72
  });

  const pad = new THREE.Mesh(new THREE.CircleGeometry(13, 48), soilMaterial);
  pad.name = "hearthmere-camp-pad";
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.035;
  pad.receiveShadow = true;
  group.add(pad);

  const road = new THREE.Mesh(new THREE.BoxGeometry(24, 0.04, 5.4), roadMaterial);
  road.name = "ashfall-road-segment";
  road.position.set(0, 0.06, -3);
  road.receiveShadow = true;
  group.add(road);

  addPalisade(group, timberMaterial);
  addBrokenCart(group, timberMaterial, stoneMaterial);
  addForgeHint(group, stoneMaterial, emberMaterial);
  addSupplyStacks(group, timberMaterial);

  const fireGlow = new THREE.PointLight(0xe08a42, 1.2, 11);
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
      disposeObject3D(scene, group);

      for (const body of colliderBodies) {
        rapier?.world?.removeRigidBody(body);
      }
    }
  };
}

function addPalisade(group, material) {
  const stakeGeometry = new THREE.CylinderGeometry(0.07, 0.09, 1.45, 6);
  const positions = [
    [-7.6, 0.72, 5.6],
    [-6.4, 0.72, 6.2],
    [-5.1, 0.72, 6.7],
    [5.8, 0.72, 5.9],
    [7.0, 0.72, 5.2],
    [-8.4, 0.72, -5.0],
    [-7.1, 0.72, -5.8],
    [7.2, 0.72, -4.9],
    [8.2, 0.72, -3.7]
  ];

  for (const [x, y, z] of positions) {
    const stake = new THREE.Mesh(stakeGeometry, material);
    stake.position.set(x, y, z);
    stake.rotation.z = (x + z) * 0.015;
    stake.castShadow = true;
    group.add(stake);
  }
}

function addBrokenCart(group, timberMaterial, stoneMaterial) {
  const cartBed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, 1.2), timberMaterial);
  cartBed.name = "broken-caravan-bed";
  cartBed.position.set(4.6, 0.34, 2.6);
  cartBed.rotation.y = -0.24;
  cartBed.castShadow = true;
  group.add(cartBed);

  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), timberMaterial);
  axle.position.set(4.6, 0.28, 2.6);
  axle.rotation.z = Math.PI / 2;
  axle.castShadow = true;
  group.add(axle);

  for (const side of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 6, 12), stoneMaterial);
    wheel.position.set(4.6 + side * 0.94, 0.3, 2.6);
    wheel.rotation.y = Math.PI / 2;
    wheel.castShadow = true;
    group.add(wheel);
  }
}

function addForgeHint(group, stoneMaterial, emberMaterial) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 1.0), stoneMaterial);
  base.name = "tessa-forge-placeholder";
  base.position.set(-1.5, 0.24, 5.0);
  base.castShadow = true;
  group.add(base);

  const coals = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.48), emberMaterial);
  coals.position.set(-1.5, 0.52, 5.0);
  group.add(coals);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.1, 0.32), stoneMaterial);
  chimney.position.set(-2.05, 0.82, 5.25);
  chimney.castShadow = true;
  group.add(chimney);
}

function addSupplyStacks(group, material) {
  const crateGeometry = new THREE.BoxGeometry(0.7, 0.55, 0.7);
  const positions = [
    [2.2, 0.28, 5.1],
    [2.95, 0.28, 5.0],
    [2.55, 0.84, 5.05]
  ];

  for (const [x, y, z] of positions) {
    const crate = new THREE.Mesh(crateGeometry, material);
    crate.position.set(x, y, z);
    crate.rotation.y = x * 0.13;
    crate.castShadow = true;
    group.add(crate);
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

function disposeObject3D(scene, object) {
  const geometries = new Set();
  const materials = new Set();
  scene.remove(object);
  object.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);

    if (Array.isArray(child.material)) {
      for (const material of child.material) materials.add(material);
    } else if (child.material) {
      materials.add(child.material);
    }
  });

  for (const geometry of geometries) {
    geometry.dispose();
  }

  for (const material of materials) {
    material.dispose();
  }
}
