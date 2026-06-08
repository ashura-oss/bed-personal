import * as THREE from "three";

export const HEARTHMERE_PALETTE = Object.freeze({
  ash: 0x3b3b36,
  soot: 0x191714,
  mud: 0x46372c,
  oldWood: 0x5c4030,
  cutWood: 0x8f7048,
  iron: 0x6f7377,
  tarnishedIron: 0x4c5558,
  bone: 0xd0c5aa,
  cloth: 0x2d3136,
  ember: 0xff7a22,
  emberGold: 0xffc36c,
  sicklyGreen: 0x6f8f5a,
  wound: 0xa7291f,
  focusBlue: 0x74d6cc
});

export function createArtTracker() {
  const geometries = new Set();
  const materials = new Set();

  return {
    geometries,
    materials,
    trackGeometry(geometry) {
      geometries.add(geometry);
      return geometry;
    },
    trackMaterial(material) {
      materials.add(material);
      return material;
    },
    material(params) {
      const material = new THREE.MeshStandardMaterial(params);
      materials.add(material);
      return material;
    },
    mesh(geometry, material, options = {}) {
      geometries.add(geometry);
      materials.add(material);
      const mesh = new THREE.Mesh(geometry, material);
      applyTransform(mesh, options);
      mesh.castShadow = options.castShadow ?? true;
      mesh.receiveShadow = options.receiveShadow ?? true;
      if (options.name) mesh.name = options.name;
      return mesh;
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      geometries.clear();
      materials.clear();
    }
  };
}

export function disposeObject3D(root) {
  const geometries = new Set();
  const materials = new Set();

  root.traverse((child) => {
    if (!child.isMesh) return;
    if (child.geometry) geometries.add(child.geometry);
    const materialList = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materialList) {
      if (material) materials.add(material);
    }
  });

  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

export function setObjectOpacity(root, opacity) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    const materialList = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materialList) {
      if (!material) continue;
      material.transparent = true;
      material.opacity = opacity;
      material.depthWrite = opacity >= 0.95;
    }
  });
}

export function addMesh(parent, tracker, geometry, material, options = {}) {
  const mesh = tracker.mesh(geometry, material, options);
  parent.add(mesh);
  return mesh;
}

export function makeMaterialSet(tracker, overrides = {}) {
  const palette = { ...HEARTHMERE_PALETTE, ...overrides };
  return {
    ash: tracker.material({ color: palette.ash, roughness: 0.96, metalness: 0.02 }),
    soot: tracker.material({ color: palette.soot, roughness: 0.98, metalness: 0.02 }),
    mud: tracker.material({ color: palette.mud, roughness: 0.94, metalness: 0.02 }),
    wood: tracker.material({ color: palette.oldWood, roughness: 0.91, metalness: 0.03 }),
    cutWood: tracker.material({ color: palette.cutWood, roughness: 0.84, metalness: 0.02 }),
    iron: tracker.material({ color: palette.iron, roughness: 0.54, metalness: 0.46 }),
    tarnishedIron: tracker.material({ color: palette.tarnishedIron, roughness: 0.74, metalness: 0.28 }),
    bone: tracker.material({ color: palette.bone, roughness: 0.78, metalness: 0.02 }),
    cloth: tracker.material({ color: palette.cloth, roughness: 0.97, metalness: 0.01 }),
    leaf: tracker.material({ color: palette.sicklyGreen, roughness: 0.88, metalness: 0.01, side: THREE.DoubleSide }),
    ember: tracker.material({
      color: palette.emberGold,
      emissive: palette.ember,
      emissiveIntensity: 1.35,
      roughness: 0.35,
      metalness: 0.04
    }),
    wound: tracker.material({
      color: palette.wound,
      emissive: palette.wound,
      emissiveIntensity: 0.9,
      roughness: 0.72,
      metalness: 0.04
    }),
    focus: tracker.material({
      color: palette.focusBlue,
      emissive: palette.focusBlue,
      emissiveIntensity: 0.75,
      roughness: 0.36,
      metalness: 0.08
    })
  };
}

export function createResourceNodeVisual(definition) {
  const tracker = createArtTracker();
  const root = new THREE.Group();
  root.name = `resource-${definition.id}-visual`;
  const materials = makeMaterialSet(tracker, {
    oldWood: definition.meshColor ?? HEARTHMERE_PALETTE.oldWood,
    sicklyGreen: definition.meshColor ?? HEARTHMERE_PALETTE.sicklyGreen
  });

  switch (definition.id) {
    case "wood":
      buildTimberNode(root, tracker, materials);
      break;
    case "ore":
    case "crystal":
    case "ember_coal":
      buildOreNode(root, tracker, materials, definition.id);
      break;
    case "bone":
      buildBoneNode(root, tracker, materials);
      break;
    case "root":
      buildRootNode(root, tracker, materials);
      break;
    case "herb":
    default:
      buildHerbNode(root, tracker, materials, definition.id);
      break;
  }

  return {
    root,
    dispose: () => tracker.dispose()
  };
}

function buildTimberNode(root, tracker, materials) {
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.25, 1.45, 9);
  addMesh(root, tracker, trunkGeo, materials.wood, {
    position: [0, 0.72, 0],
    rotation: [0.05, 0, -0.08],
    scale: [1.05, 1, 0.92],
    name: "ash-scarred-timber-trunk"
  });

  const capGeo = new THREE.CylinderGeometry(0.19, 0.2, 0.045, 9);
  addMesh(root, tracker, capGeo, materials.cutWood, {
    position: [0.05, 1.46, -0.02],
    rotation: [0.05, 0, -0.08],
    name: "fresh-cut-timber-face"
  });

  const scarGeo = new THREE.BoxGeometry(0.035, 0.34, 0.012);
  for (const [x, y, z, ry] of [
    [0.18, 0.58, 0.07, 0.2],
    [-0.15, 0.94, -0.09, 2.2],
    [0.04, 1.14, 0.17, -0.7]
  ]) {
    addMesh(root, tracker, scarGeo.clone(), materials.soot, {
      position: [x, y, z],
      rotation: [0, ry, 0.16],
      receiveShadow: false,
      name: "charred-bark-scar"
    });
  }

  const branchGeo = new THREE.CylinderGeometry(0.045, 0.07, 0.48, 6);
  addMesh(root, tracker, branchGeo, materials.wood, {
    position: [-0.22, 0.88, 0.02],
    rotation: [0.22, 0, 1.1],
    scale: [1, 1.12, 1],
    name: "broken-branch-left"
  });
  addMesh(root, tracker, branchGeo.clone(), materials.wood, {
    position: [0.2, 1.02, -0.05],
    rotation: [-0.16, 0.22, -1.0],
    scale: [0.82, 0.82, 0.82],
    name: "broken-branch-right"
  });

  const rootGeo = new THREE.CylinderGeometry(0.045, 0.075, 0.5, 6);
  for (const [x, z, ry] of [
    [0.24, 0.1, 1.18],
    [-0.22, -0.05, -1.0],
    [0.04, -0.25, 0.08]
  ]) {
    addMesh(root, tracker, rootGeo.clone(), materials.wood, {
      position: [x, 0.08, z],
      rotation: [Math.PI * 0.5, 0, ry],
      scale: [0.82, 1, 0.82],
      name: "exposed-timber-root"
    });
  }
}

function buildOreNode(root, tracker, materials, id) {
  const stoneMaterial = id === "crystal" ? materials.focus : id === "ember_coal" ? materials.soot : materials.iron;
  const veinMaterial = id === "ember_coal" ? materials.ember : id === "crystal" ? materials.focus : materials.tarnishedIron;
  const rockGeo = new THREE.DodecahedronGeometry(0.33, 0);

  for (const [x, y, z, scale, ry] of [
    [0, 0.32, 0, [1.25, 0.82, 0.95], 0.1],
    [-0.28, 0.22, 0.18, [0.72, 0.58, 0.82], 1.4],
    [0.25, 0.18, -0.18, [0.64, 0.5, 0.74], -0.8]
  ]) {
    addMesh(root, tracker, rockGeo.clone(), stoneMaterial, {
      position: [x, y, z],
      rotation: [0.24, ry, -0.12],
      scale,
      name: `${id}-jagged-node`
    });
  }

  const veinGeo = new THREE.BoxGeometry(0.055, 0.46, 0.045);
  for (const [x, y, z, rz] of [
    [0.08, 0.4, 0.3, -0.4],
    [-0.25, 0.27, 0.27, 0.32],
    [0.3, 0.26, -0.05, -0.16]
  ]) {
    addMesh(root, tracker, veinGeo.clone(), veinMaterial, {
      position: [x, y, z],
      rotation: [0.38, 0.16, rz],
      scale: [1, 1, 0.7],
      receiveShadow: false,
      name: `${id}-visible-vein`
    });
  }
}

function buildHerbNode(root, tracker, materials, id) {
  const stemGeo = new THREE.CylinderGeometry(0.018, 0.028, 0.5, 5);
  const leafGeo = new THREE.BoxGeometry(0.08, 0.24, 0.012);
  const bloomGeo = new THREE.SphereGeometry(0.045, 8, 6);

  for (const [x, z, height, lean] of [
    [0, 0, 0.5, 0.12],
    [-0.11, 0.06, 0.42, -0.18],
    [0.12, -0.05, 0.46, 0.2],
    [0.03, 0.16, 0.38, -0.08]
  ]) {
    addMesh(root, tracker, stemGeo.clone(), materials.leaf, {
      position: [x, height * 0.5, z],
      rotation: [lean, 0, lean * 0.6],
      scale: [1, height / 0.5, 1],
      name: `${id}-thin-stem`
    });
    addMesh(root, tracker, leafGeo.clone(), materials.leaf, {
      position: [x + lean * 0.2, height * 0.72, z + 0.02],
      rotation: [0.35, lean > 0 ? 0.45 : -0.45, lean],
      receiveShadow: false,
      name: `${id}-ashleaf-blade`
    });
  }

  addMesh(root, tracker, bloomGeo, materials.ember, {
    position: [0.03, 0.56, 0.03],
    scale: [0.8, 1, 0.8],
    receiveShadow: false,
    name: `${id}-ember-bloom`
  });
}

function buildBoneNode(root, tracker, materials) {
  const spineGeo = new THREE.CylinderGeometry(0.04, 0.055, 0.62, 7);
  const ribGeo = new THREE.CylinderGeometry(0.018, 0.026, 0.46, 6);
  const shardGeo = new THREE.ConeGeometry(0.06, 0.32, 6);

  addMesh(root, tracker, spineGeo, materials.bone, {
    position: [0, 0.2, 0],
    rotation: [Math.PI * 0.5, 0.18, 0.35],
    name: "bleached-bone-spine"
  });

  for (const [x, z, side] of [
    [-0.12, 0.06, -1],
    [0.12, -0.06, 1],
    [-0.18, -0.1, -1],
    [0.18, 0.1, 1]
  ]) {
    addMesh(root, tracker, ribGeo.clone(), materials.bone, {
      position: [x, 0.18, z],
      rotation: [Math.PI * 0.55, 0.15 * side, 0.72 * side],
      scale: [1, 0.84, 1],
      name: "bleached-bone-rib"
    });
  }

  addMesh(root, tracker, shardGeo, materials.bone, {
    position: [0.18, 0.18, -0.22],
    rotation: [0.34, 0.2, -0.42],
    name: "bone-splinter"
  });
}

function buildRootNode(root, tracker, materials) {
  const rootGeo = new THREE.CylinderGeometry(0.055, 0.09, 0.82, 7);
  const thornGeo = new THREE.ConeGeometry(0.04, 0.18, 5);

  for (const [x, z, ry, scale] of [
    [0, 0, 0.15, [1, 1, 1]],
    [-0.16, 0.12, -0.8, [0.74, 0.86, 0.74]],
    [0.18, -0.1, 0.95, [0.72, 0.8, 0.72]]
  ]) {
    addMesh(root, tracker, rootGeo.clone(), materials.wood, {
      position: [x, 0.22, z],
      rotation: [Math.PI * 0.5, 0.18, ry],
      scale,
      name: "blackroot-twist"
    });
  }

  for (const [x, z, ry] of [
    [0.22, 0.08, 0.7],
    [-0.18, -0.12, -0.3],
    [0.02, 0.24, 0.1]
  ]) {
    addMesh(root, tracker, thornGeo.clone(), materials.wound, {
      position: [x, 0.22, z],
      rotation: [0.65, ry, 0.34],
      receiveShadow: false,
      name: "blackroot-ember-thorn"
    });
  }
}

function applyTransform(object, options) {
  if (options.position) {
    object.position.set(options.position[0], options.position[1], options.position[2]);
  }
  if (options.rotation) {
    object.rotation.set(options.rotation[0], options.rotation[1], options.rotation[2]);
  }
  if (options.scale) {
    if (Array.isArray(options.scale)) {
      object.scale.set(options.scale[0], options.scale[1], options.scale[2]);
    } else {
      object.scale.setScalar(options.scale);
    }
  }
}
