import * as THREE from "three";

const BODY_COLOR = 0x302a24;
const LIMB_COLOR = 0x3c352d;
const HEAD_COLOR = 0x5a5448;
const CLOTH_COLOR = 0x1c1a28;
const BONE_COLOR = 0x6e675d;
const WEAK_POINT_COLOR = 0xf0e8a0;
const EYE_COLOR = 0x9fe7d4;

/**
 * TrainingEnemyVisual — an articulated greybox enemy: breathing idle, swaying
 * cloth tatters, glowing eyes, and a pulsing chest weak-point that flares on
 * hit and as HP drops. Driven each frame by hit-flash / death progress.
 */
export class TrainingEnemyVisual {
  group = new THREE.Group();
  root = new THREE.Group();
  torsoPivot = new THREE.Group();
  headPivot = new THREE.Group();
  leftArmPivot = new THREE.Group();
  rightArmPivot = new THREE.Group();
  leftLegPivot = new THREE.Group();
  rightLegPivot = new THREE.Group();
  clothPivot = new THREE.Group();
  geometries = [];
  materials = [];
  idleTime = 0;

  constructor() {
    this.group.add(this.root);
    this.root.add(
      this.torsoPivot,
      this.leftArmPivot,
      this.rightArmPivot,
      this.leftLegPivot,
      this.rightLegPivot,
      this.clothPivot,
    );

    this.bodyMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({
      color: BODY_COLOR, roughness: 0.92, metalness: 0.06, emissive: 0x5c1010, emissiveIntensity: 0,
    }));
    this.limbMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({
      color: LIMB_COLOR, roughness: 0.94, metalness: 0.03, emissive: 0x4a140c, emissiveIntensity: 0,
    }));
    this.headMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({
      color: HEAD_COLOR, roughness: 0.86, metalness: 0.04, emissive: 0x701818, emissiveIntensity: 0,
    }));
    this.clothMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({
      color: CLOTH_COLOR, roughness: 0.98, metalness: 0, emissive: 0x380808, emissiveIntensity: 0,
    }));
    this.boneMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({
      color: BONE_COLOR, roughness: 0.9, metalness: 0.02, emissive: 0x4a1e10, emissiveIntensity: 0,
    }));
    this.weakPointMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({
      color: WEAK_POINT_COLOR, roughness: 0.18, metalness: 0.12, emissive: 0xd4c860, emissiveIntensity: 1.7,
    }));
    this.eyeMaterial = this.trackMaterial(new THREE.MeshStandardMaterial({
      color: EYE_COLOR, roughness: 0.18, metalness: 0, emissive: 0x78dbc4, emissiveIntensity: 1.6,
    }));

    const torsoGeometry = this.trackGeometry(new THREE.CapsuleGeometry(0.22, 0.42, 5, 8));
    const shoulderGeometry = this.trackGeometry(new THREE.BoxGeometry(0.52, 0.18, 0.24));
    const humpGeometry = this.trackGeometry(new THREE.SphereGeometry(0.18, 10, 8));
    const headGeometry = this.trackGeometry(new THREE.SphereGeometry(0.19, 12, 10));
    const jawGeometry = this.trackGeometry(new THREE.BoxGeometry(0.2, 0.1, 0.16));
    const limbGeometry = this.trackGeometry(new THREE.CapsuleGeometry(0.085, 0.46, 4, 7));
    const shinGeometry = this.trackGeometry(new THREE.CapsuleGeometry(0.09, 0.5, 4, 7));
    const handGeometry = this.trackGeometry(new THREE.SphereGeometry(0.08, 8, 6));
    const weakPointGeometry = this.trackGeometry(new THREE.SphereGeometry(0.12, 10, 8));
    const eyeGeometry = this.trackGeometry(new THREE.SphereGeometry(0.045, 8, 6));
    const clothGeometry = this.trackGeometry(new THREE.BoxGeometry(0.11, 0.42, 0.04));
    const backClothGeometry = this.trackGeometry(new THREE.BoxGeometry(0.38, 0.48, 0.07));

    this.torsoPivot.position.set(0, 0.02, 0.02);
    this.headPivot.position.set(0, 0.47, 0.12);
    this.leftArmPivot.position.set(-0.28, 0.13, 0.04);
    this.rightArmPivot.position.set(0.28, 0.13, 0.04);
    this.leftLegPivot.position.set(-0.14, -0.18, 0.03);
    this.rightLegPivot.position.set(0.14, -0.18, 0.03);
    this.clothPivot.position.set(0, -0.12, 0.13);

    this.addPart(this.torsoPivot, torsoGeometry, this.bodyMaterial, [0, 0, 0], [0, 0, 0], [1.02, 1.08, 0.92]);
    this.addPart(this.torsoPivot, shoulderGeometry, this.boneMaterial, [0, 0.16, -0.02], [0.12, 0, 0], [1, 1, 1]);
    this.addPart(this.torsoPivot, humpGeometry, this.clothMaterial, [0, 0.18, -0.18], [0, 0, 0], [1.1, 1.35, 0.92]);
    this.weakPoint = this.addPart(this.torsoPivot, weakPointGeometry, this.weakPointMaterial, [0, 0.02, 0.24], [0, 0, 0], [1, 1.08, 0.96]);
    this.addPart(this.torsoPivot, shoulderGeometry, this.boneMaterial, [0, 0.03, 0.18], [-0.85, 0, 0], [0.42, 0.2, 0.3]);

    this.torsoPivot.add(this.headPivot);
    this.addPart(this.headPivot, headGeometry, this.headMaterial, [0, 0.05, 0.05], [0.08, 0, 0], [0.94, 1.12, 0.96]);
    this.addPart(this.headPivot, jawGeometry, this.boneMaterial, [0, -0.07, 0.17], [0.18, 0, 0], [1, 1, 1]);
    this.addPart(this.headPivot, eyeGeometry, this.eyeMaterial, [-0.07, 0.05, 0.2], [0, 0, 0], [1, 1, 1]);
    this.addPart(this.headPivot, eyeGeometry, this.eyeMaterial, [0.07, 0.05, 0.2], [0, 0, 0], [1, 1, 1]);

    this.addPart(this.leftArmPivot, limbGeometry, this.limbMaterial, [0, -0.28, 0], [0.08, 0, 0.06], [1, 1, 1]);
    this.addPart(this.leftArmPivot, handGeometry, this.boneMaterial, [0.03, -0.61, 0.06], [0, 0, 0], [0.9, 1, 0.9]);
    this.addPart(this.rightArmPivot, limbGeometry, this.limbMaterial, [0, -0.28, 0], [0.08, 0, -0.06], [1, 1, 1]);
    this.addPart(this.rightArmPivot, handGeometry, this.boneMaterial, [-0.03, -0.61, 0.06], [0, 0, 0], [0.9, 1, 0.9]);

    this.addPart(this.leftLegPivot, shinGeometry, this.limbMaterial, [0, -0.35, -0.02], [-0.16, 0, 0.08], [1, 1.02, 0.94]);
    this.addPart(this.leftLegPivot, handGeometry, this.boneMaterial, [0.02, -0.68, 0.1], [0, 0, 0], [1.05, 0.6, 1.45]);
    this.addPart(this.rightLegPivot, shinGeometry, this.limbMaterial, [0, -0.35, -0.02], [-0.16, 0, -0.08], [1, 1.02, 0.94]);
    this.addPart(this.rightLegPivot, handGeometry, this.boneMaterial, [-0.02, -0.68, 0.1], [0, 0, 0], [1.05, 0.6, 1.45]);

    this.addPart(this.clothPivot, backClothGeometry, this.clothMaterial, [0, -0.18, -0.19], [0.16, 0, 0], [1, 1, 1]);
    this.frontStripLeft = this.addPart(this.clothPivot, clothGeometry, this.clothMaterial, [-0.13, -0.22, 0.05], [0.08, 0, -0.06], [1, 1, 1]);
    this.frontStripCenter = this.addPart(this.clothPivot, clothGeometry, this.clothMaterial, [0, -0.24, 0.07], [0.14, 0, 0], [1.1, 1.08, 1]);
    this.frontStripRight = this.addPart(this.clothPivot, clothGeometry, this.clothMaterial, [0.13, -0.22, 0.05], [0.08, 0, 0.06], [1, 1, 1]);

    this.reset();
  }

  reset() {
    this.idleTime = 0;
    this.root.position.set(0, -0.02, 0);
    this.root.rotation.set(0, 0, 0);
    this.torsoPivot.rotation.set(-0.34, 0, 0);
    this.headPivot.rotation.set(0.42, 0, 0);
    this.leftArmPivot.rotation.set(-0.18, 0, 0.24);
    this.rightArmPivot.rotation.set(-0.18, 0, -0.24);
    this.leftLegPivot.rotation.set(0.18, 0, 0.06);
    this.rightLegPivot.rotation.set(0.18, 0, -0.06);
    this.clothPivot.rotation.set(0.08, 0, 0);
    this.weakPoint.scale.set(1, 1.08, 0.96);
    this.frontStripLeft.rotation.set(0.08, 0, -0.06);
    this.frontStripCenter.rotation.set(0.14, 0, 0);
    this.frontStripRight.rotation.set(0.08, 0, 0.06);
    this.update(0, 0, 0, 1, false, true);
  }

  update(dt, hitFlashRatio, deathProgress, hpRatio, isDying, isAlive) {
    this.idleTime += dt;

    const flash = hitFlashRatio * hitFlashRatio;
    const death = Math.min(Math.max(deathProgress, 0), 1);
    const live = isAlive || isDying ? 1 : 0;
    const breathe = Math.sin(this.idleTime * 2.1) * 0.035;
    const sway = Math.sin(this.idleTime * 1.2) * 0.08;
    const pulse = 0.5 + 0.5 * Math.sin(this.idleTime * 4.4);
    const tatter = Math.sin(this.idleTime * 3.1) * 0.06;
    const deathBurst = Math.sin(death * Math.PI) * 0.22;

    this.root.position.y = -0.02 + breathe * (1 - death) - death * 0.08;
    this.root.rotation.z = sway * 0.06 - death * 0.68;
    this.torsoPivot.rotation.x = -0.34 - breathe * 0.35 + flash * 0.16 - death * 1.1;
    this.headPivot.rotation.x = 0.42 + breathe * 0.22 - flash * 0.1 + death * 0.32;
    this.leftArmPivot.rotation.x = -0.18 - sway * 0.25 - death * 0.72;
    this.leftArmPivot.rotation.z = 0.24 + breathe * 0.2 + death * 0.24;
    this.rightArmPivot.rotation.x = -0.18 + sway * 0.25 - death * 0.72;
    this.rightArmPivot.rotation.z = -0.24 - breathe * 0.2 - death * 0.24;
    this.leftLegPivot.rotation.x = 0.18 - breathe * 0.35 + death * 0.34;
    this.leftLegPivot.rotation.z = 0.06 - death * 0.16;
    this.rightLegPivot.rotation.x = 0.18 + breathe * 0.35 + death * 0.34;
    this.rightLegPivot.rotation.z = -0.06 + death * 0.16;
    this.clothPivot.rotation.x = 0.08 + breathe * 0.45 + death * 0.38;
    this.frontStripLeft.rotation.x = 0.08 + tatter + death * 0.45;
    this.frontStripCenter.rotation.x = 0.14 + tatter * 0.65 + death * 0.5;
    this.frontStripRight.rotation.x = 0.08 - tatter + death * 0.45;

    const weakPointScale = 1 + pulse * 0.12 + flash * 0.22 + (1 - hpRatio) * 0.08 + deathBurst;
    this.weakPoint.scale.set(weakPointScale, weakPointScale * 1.08, weakPointScale * 0.96);

    const bodyFlash = flash * 0.85 * live;
    this.bodyMaterial.emissiveIntensity = bodyFlash;
    this.limbMaterial.emissiveIntensity = bodyFlash * 0.7;
    this.headMaterial.emissiveIntensity = bodyFlash * 0.9;
    this.clothMaterial.emissiveIntensity = bodyFlash * 0.45;
    this.boneMaterial.emissiveIntensity = bodyFlash * 0.2;

    const glowFade = live * (1 - death * 0.78);
    this.weakPointMaterial.emissiveIntensity = (1.35 + pulse * 0.75 + (1 - hpRatio) * 0.4 + flash * 1.1) * glowFade;
    this.eyeMaterial.emissiveIntensity = (1.1 + pulse * 0.45 + flash * 0.75) * glowFade;
  }

  dispose() {
    for (const geometry of this.geometries) {
      geometry.dispose();
    }
    for (const material of this.materials) {
      material.dispose();
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  addPart(parent, geometry, material, position, rotation, scale) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    parent.add(mesh);
    return mesh;
  }

  trackGeometry(geometry) {
    this.geometries.push(geometry);
    return geometry;
  }

  trackMaterial(material) {
    this.materials.push(material);
    return material;
  }
}
