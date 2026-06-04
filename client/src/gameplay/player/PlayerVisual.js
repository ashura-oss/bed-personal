import * as THREE from "three";

/**
 * PlayerVisual — a procedural ranger: hooded body, billowing cloak, slung bow,
 * quiver, hip blade, and glowing focus glyphs. Driven each frame by the
 * player's locomotion state (idle/move/sprint/dodge/dying/dead), HP ratio, and
 * i-frame flag — animating stride, lean, cloak sway, and emissive feedback.
 */
export class PlayerVisual {
  root = new THREE.Group();
  bodyRig = new THREE.Group();
  headRig = new THREE.Group();
  cloakRig = new THREE.Group();
  leftArmPivot = new THREE.Group();
  rightArmPivot = new THREE.Group();
  bowRig = new THREE.Group();
  quiverRig = new THREE.Group();
  hipBladeRig = new THREE.Group();
  geometries = new Set();
  materials = new Set();
  surfaceMaterials = [];
  focusMaterials = [];
  hurtColor = new THREE.Color(0xcf5f58);
  sprintColor = new THREE.Color(0xb9df7f);
  focusColor = new THREE.Color(0x75d8cb);
  dodgeColor = new THREE.Color(0x9be9ff);
  lowHpColor = new THREE.Color(0xf0bf72);
  elapsed = 0;
  hurtTimer = 0;

  constructor() {
    this.root.position.y = -0.02;
    this.bodyRig.position.y = -0.08;
    this.root.add(this.bodyRig);

    const hoodMaterial = this.createMaterial({ color: 0x243831, roughness: 0.95, metalness: 0.04 }, "surface");
    const cloakMaterial = this.createMaterial({ color: 0x355247, roughness: 0.96, metalness: 0.02, side: THREE.DoubleSide }, "surface");
    const cloakLiningMaterial = this.createMaterial({ color: 0x5a3947, roughness: 0.9, metalness: 0.02, side: THREE.DoubleSide }, "surface");
    const tunicMaterial = this.createMaterial({ color: 0x384554, roughness: 0.88, metalness: 0.08 }, "surface");
    const leatherMaterial = this.createMaterial({ color: 0x736549, roughness: 0.92, metalness: 0.06 }, "surface");
    const metalMaterial = this.createMaterial({ color: 0x8b97a5, roughness: 0.42, metalness: 0.68 }, "surface");
    const faceMaterial = this.createMaterial({ color: 0x1a1d21, roughness: 0.55, metalness: 0.34 }, "surface");
    const focusMaterial = this.createMaterial({
      color: this.focusColor.getHex(),
      emissive: this.focusColor.getHex(),
      emissiveIntensity: 0.55,
      roughness: 0.36,
      metalness: 0.1,
    }, "focus");

    const torsoGeo = this.trackGeometry(new THREE.CylinderGeometry(0.22, 0.29, 0.72, 8));
    const shoulderGeo = this.trackGeometry(new THREE.SphereGeometry(0.11, 10, 8));
    const legGeo = this.trackGeometry(new THREE.BoxGeometry(0.18, 0.5, 0.22));
    const beltGeo = this.trackGeometry(new THREE.BoxGeometry(0.48, 0.1, 0.18));
    const sashGeo = this.trackGeometry(new THREE.BoxGeometry(0.14, 0.4, 0.04));
    const satchelGeo = this.trackGeometry(new THREE.BoxGeometry(0.15, 0.18, 0.12));
    const headGeo = this.trackGeometry(new THREE.SphereGeometry(0.16, 12, 10));
    const hoodGeo = this.trackGeometry(new THREE.ConeGeometry(0.26, 0.36, 8));
    const cowlGeo = this.trackGeometry(new THREE.CylinderGeometry(0.16, 0.23, 0.2, 8));
    const facePlateGeo = this.trackGeometry(new THREE.BoxGeometry(0.18, 0.14, 0.035));
    const eyeGeo = this.trackGeometry(new THREE.SphereGeometry(0.025, 8, 6));
    const cloakOuterGeo = this.trackGeometry(new THREE.ConeGeometry(0.46, 1.18, 10, 1, true));
    const cloakInnerGeo = this.trackGeometry(new THREE.ConeGeometry(0.32, 0.95, 10, 1, true));
    const armGeo = this.trackGeometry(new THREE.CapsuleGeometry(0.055, 0.24, 4, 8));
    const forearmGeo = this.trackGeometry(new THREE.CapsuleGeometry(0.048, 0.2, 4, 8));
    const handGeo = this.trackGeometry(new THREE.BoxGeometry(0.08, 0.08, 0.08));
    const bracerGeo = this.trackGeometry(new THREE.CylinderGeometry(0.07, 0.075, 0.16, 6));
    const bowGripGeo = this.trackGeometry(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 6));
    const bowLimbGeo = this.trackGeometry(new THREE.CylinderGeometry(0.016, 0.02, 0.34, 6));
    const bowStringGeo = this.trackGeometry(new THREE.BoxGeometry(0.01, 0.56, 0.01));
    const quiverGeo = this.trackGeometry(new THREE.CylinderGeometry(0.055, 0.065, 0.42, 8));
    const arrowGeo = this.trackGeometry(new THREE.CylinderGeometry(0.01, 0.01, 0.34, 4));
    const fletchGeo = this.trackGeometry(new THREE.BoxGeometry(0.04, 0.05, 0.01));
    const glyphGeo = this.trackGeometry(new THREE.BoxGeometry(0.08, 0.08, 0.025));
    const scabbardGeo = this.trackGeometry(new THREE.BoxGeometry(0.08, 0.42, 0.06));
    const bladeTipGeo = this.trackGeometry(new THREE.ConeGeometry(0.04, 0.12, 6));
    const hiltGeo = this.trackGeometry(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6));
    const crossGuardGeo = this.trackGeometry(new THREE.BoxGeometry(0.14, 0.03, 0.04));
    const pommelGeo = this.trackGeometry(new THREE.SphereGeometry(0.03, 8, 6));

    const torso = this.createMesh(torsoGeo, tunicMaterial);
    torso.position.set(0, 0.12, 0.01);
    this.bodyRig.add(torso);

    const leftLeg = this.createMesh(legGeo, leatherMaterial);
    leftLeg.position.set(-0.12, -0.47, 0.02);
    this.bodyRig.add(leftLeg);

    const rightLeg = this.createMesh(legGeo, leatherMaterial);
    rightLeg.position.set(0.12, -0.47, 0.02);
    this.bodyRig.add(rightLeg);

    const belt = this.createMesh(beltGeo, leatherMaterial);
    belt.position.set(0, -0.14, 0.06);
    this.bodyRig.add(belt);

    const sash = this.createMesh(sashGeo, cloakLiningMaterial);
    sash.position.set(-0.03, -0.23, 0.16);
    sash.rotation.z = 0.08;
    this.bodyRig.add(sash);

    const satchel = this.createMesh(satchelGeo, leatherMaterial);
    satchel.position.set(0.23, -0.17, 0.09);
    satchel.rotation.z = -0.14;
    this.bodyRig.add(satchel);

    const leftShoulder = this.createMesh(shoulderGeo, metalMaterial);
    leftShoulder.position.set(-0.27, 0.31, 0.01);
    leftShoulder.scale.set(1.15, 0.85, 1);
    this.bodyRig.add(leftShoulder);

    const rightShoulder = this.createMesh(shoulderGeo, hoodMaterial);
    rightShoulder.position.set(0.26, 0.28, 0.01);
    rightShoulder.scale.set(0.95, 0.76, 0.92);
    this.bodyRig.add(rightShoulder);

    this.headRig.position.set(0, 0.56, 0.03);
    this.bodyRig.add(this.headRig);

    const head = this.createMesh(headGeo, hoodMaterial);
    this.headRig.add(head);

    const hood = this.createMesh(hoodGeo, hoodMaterial);
    hood.position.set(0, 0.06, 0.01);
    hood.rotation.x = 0.04;
    this.headRig.add(hood);

    const cowl = this.createMesh(cowlGeo, hoodMaterial);
    cowl.position.set(0, -0.08, 0.03);
    this.headRig.add(cowl);

    const facePlate = this.createMesh(facePlateGeo, faceMaterial);
    facePlate.position.set(0, -0.01, 0.13);
    this.headRig.add(facePlate);

    const leftEye = this.createMesh(eyeGeo, focusMaterial);
    leftEye.position.set(-0.05, 0.01, 0.15);
    this.headRig.add(leftEye);

    const rightEye = this.createMesh(eyeGeo, focusMaterial);
    rightEye.position.set(0.05, 0.01, 0.15);
    this.headRig.add(rightEye);

    this.focusGlyph = this.createMesh(glyphGeo, focusMaterial);
    this.focusGlyph.position.set(0.05, 0.09, 0.19);
    this.focusGlyph.rotation.z = Math.PI * 0.25;
    this.bodyRig.add(this.focusGlyph);

    this.cloakRig.position.set(0, 0.31, -0.1);
    this.bodyRig.add(this.cloakRig);

    this.cloakOuter = this.createMesh(cloakOuterGeo, cloakMaterial);
    this.cloakOuter.position.set(0, -0.56, -0.02);
    this.cloakOuter.scale.set(0.96, 1, 0.72);
    this.cloakOuter.rotation.x = 0.03;
    this.cloakRig.add(this.cloakOuter);

    this.cloakInner = this.createMesh(cloakInnerGeo, cloakLiningMaterial);
    this.cloakInner.position.set(0, -0.5, 0.04);
    this.cloakInner.scale.set(0.92, 1, 0.56);
    this.cloakInner.rotation.x = 0.06;
    this.cloakRig.add(this.cloakInner);

    this.leftArmPivot.position.set(-0.31, 0.23, 0.01);
    this.bodyRig.add(this.leftArmPivot);
    this.buildArm(this.leftArmPivot, hoodMaterial, metalMaterial, armGeo, forearmGeo, bracerGeo, handGeo, -1);

    this.rightArmPivot.position.set(0.31, 0.22, 0.03);
    this.bodyRig.add(this.rightArmPivot);
    this.buildArm(this.rightArmPivot, hoodMaterial, leatherMaterial, armGeo, forearmGeo, bracerGeo, handGeo, 1);

    this.bowRig.position.set(0.21, 0.11, -0.17);
    this.bowRig.rotation.set(0.42, -0.48, 0.62);
    this.bodyRig.add(this.bowRig);
    this.buildBow(this.bowRig, bowGripGeo, bowLimbGeo, bowStringGeo, leatherMaterial, metalMaterial);

    this.quiverRig.position.set(-0.17, 0.12, -0.15);
    this.quiverRig.rotation.set(0.32, 0.5, -0.24);
    this.bodyRig.add(this.quiverRig);
    this.buildQuiver(this.quiverRig, quiverGeo, arrowGeo, fletchGeo, leatherMaterial, focusMaterial);

    this.hipBladeRig.position.set(0.33, -0.1, 0.12);
    this.hipBladeRig.rotation.set(0.04, -0.08, -0.28);
    this.bodyRig.add(this.hipBladeRig);
    this.buildHipBlade(this.hipBladeRig, scabbardGeo, bladeTipGeo, hiltGeo, crossGuardGeo, pommelGeo, leatherMaterial, metalMaterial);
  }

  update(dt, state, hpRatio, hasIFrames) {
    this.elapsed += dt;
    if (this.hurtTimer > 0) this.hurtTimer = Math.max(0, this.hurtTimer - dt);

    const isMoving = state === "moving" || state === "sprinting";
    const phaseSpeed = state === "sprinting" ? 9.5 : state === "moving" ? 6.3 : state === "dodging" ? 12 : 2.3;
    const phase = this.elapsed * phaseSpeed;
    const stride = Math.sin(phase);
    const sway = Math.sin(phase * 0.5);
    const bobAmount = state === "sprinting" ? 0.04 : state === "moving" ? 0.026 : state === "dodging" ? 0.012 : 0.01;
    const bob = state === "dead" || state === "dying" ? 0 : Math.sin(phase) * bobAmount;

    const targetBodyY = state === "dodging" ? -0.15 : state === "dying" ? -0.2 : state === "dead" ? -0.24 : -0.08;
    const targetLean = state === "sprinting" ? 0.18 : state === "moving" ? 0.08 : state === "dodging" ? 0.58 : state === "dying" ? 1.05 : state === "dead" ? 1.15 : 0.02;
    const targetRoll = state === "dodging" ? 0.12 : state === "dying" ? -0.2 : state === "dead" ? -0.28 : sway * (state === "sprinting" ? 0.05 : 0.025);
    const cloakPitch = state === "sprinting" ? -0.32 : state === "moving" ? -0.15 : state === "dodging" ? -0.72 : state === "dying" ? -0.16 : state === "dead" ? -0.06 : -0.04;
    const cloakRoll = state === "dodging" ? -0.16 : state === "dead" || state === "dying" ? 0.12 : -sway * (state === "sprinting" ? 0.09 : 0.05);

    this.root.position.y = bob;
    this.bodyRig.position.y = THREE.MathUtils.damp(this.bodyRig.position.y, targetBodyY, 10, dt);
    this.bodyRig.rotation.x = THREE.MathUtils.damp(this.bodyRig.rotation.x, targetLean, 12, dt);
    this.bodyRig.rotation.z = THREE.MathUtils.damp(this.bodyRig.rotation.z, targetRoll, 10, dt);
    this.headRig.rotation.x = THREE.MathUtils.damp(this.headRig.rotation.x, state === "dying" || state === "dead" ? -0.38 : state === "sprinting" ? -0.08 : 0.02, 12, dt);
    this.headRig.rotation.y = THREE.MathUtils.damp(this.headRig.rotation.y, state === "dead" || state === "dying" ? -0.15 : sway * 0.04, 8, dt);
    this.cloakRig.rotation.x = THREE.MathUtils.damp(this.cloakRig.rotation.x, cloakPitch, 10, dt);
    this.cloakRig.rotation.z = THREE.MathUtils.damp(this.cloakRig.rotation.z, cloakRoll, 10, dt);
    this.cloakOuter.scale.z = THREE.MathUtils.damp(this.cloakOuter.scale.z, state === "dodging" ? 0.86 : state === "sprinting" ? 0.64 : 0.72, 8, dt);
    this.cloakInner.scale.z = THREE.MathUtils.damp(this.cloakInner.scale.z, state === "dodging" ? 0.74 : state === "sprinting" ? 0.5 : 0.56, 8, dt);

    const leftArmTargetX = state === "dodging" ? -0.96 : state === "dying" ? -0.32 : state === "dead" ? -0.48 : -0.1 + (isMoving ? stride * (state === "sprinting" ? 0.64 : 0.38) : 0);
    const rightArmTargetX = state === "dodging" ? -0.72 : state === "dying" ? -0.18 : state === "dead" ? -0.32 : -0.02 - (isMoving ? stride * (state === "sprinting" ? 0.64 : 0.38) : 0);
    const leftArmTargetZ = state === "dodging" ? -0.42 : state === "dying" ? -0.7 : state === "dead" ? -0.86 : -0.18 + sway * 0.04;
    const rightArmTargetZ = state === "dodging" ? 0.34 : state === "dying" ? 0.44 : state === "dead" ? 0.58 : 0.18 - sway * 0.04;

    this.leftArmPivot.rotation.x = THREE.MathUtils.damp(this.leftArmPivot.rotation.x, leftArmTargetX, 14, dt);
    this.rightArmPivot.rotation.x = THREE.MathUtils.damp(this.rightArmPivot.rotation.x, rightArmTargetX, 14, dt);
    this.leftArmPivot.rotation.z = THREE.MathUtils.damp(this.leftArmPivot.rotation.z, leftArmTargetZ, 12, dt);
    this.rightArmPivot.rotation.z = THREE.MathUtils.damp(this.rightArmPivot.rotation.z, rightArmTargetZ, 12, dt);

    this.bowRig.rotation.x = THREE.MathUtils.damp(this.bowRig.rotation.x, state === "dodging" ? 0.75 : state === "sprinting" ? 0.54 : 0.42, 10, dt);
    this.bowRig.rotation.z = THREE.MathUtils.damp(this.bowRig.rotation.z, state === "dodging" ? 0.95 : state === "sprinting" ? 0.75 : 0.62, 10, dt);
    this.quiverRig.rotation.x = THREE.MathUtils.damp(this.quiverRig.rotation.x, state === "dodging" ? 0.56 : state === "sprinting" ? 0.42 : 0.32, 10, dt);
    this.hipBladeRig.rotation.z = THREE.MathUtils.damp(this.hipBladeRig.rotation.z, state === "dodging" ? -0.46 : state === "sprinting" ? -0.34 : -0.28, 10, dt);

    const glyphPulse = 1 + Math.max(0, Math.sin(this.elapsed * (state === "sprinting" ? 12 : 8))) * 0.08 + (state === "dodging" ? 0.12 : 0);
    const glyphScale = THREE.MathUtils.damp(this.focusGlyph.scale.x, glyphPulse, 10, dt);
    this.focusGlyph.scale.setScalar(glyphScale);

    this.updateMaterialFeedback(state, hpRatio, hasIFrames);
  }

  flashDamage() {
    this.hurtTimer = 0.22;
  }

  reset() {
    this.hurtTimer = 0;
    this.updateMaterialFeedback("idle", 1, false);
  }

  dispose() {
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
  }

  // ── Private builders ─────────────────────────────────────────────────────────

  buildArm(pivot, clothMaterial, trimMaterial, armGeo, forearmGeo, bracerGeo, handGeo, side) {
    const upperArm = this.createMesh(armGeo, clothMaterial);
    upperArm.position.set(0, -0.16, 0.02);
    upperArm.rotation.z = side * 0.04;
    pivot.add(upperArm);

    const forearm = this.createMesh(forearmGeo, clothMaterial);
    forearm.position.set(0, -0.39, 0.06);
    forearm.rotation.z = side * 0.12;
    pivot.add(forearm);

    const bracer = this.createMesh(bracerGeo, trimMaterial);
    bracer.position.set(0, -0.39, 0.06);
    pivot.add(bracer);

    const hand = this.createMesh(handGeo, trimMaterial);
    hand.position.set(0, -0.55, 0.08);
    pivot.add(hand);
  }

  buildBow(rig, bowGripGeo, bowLimbGeo, bowStringGeo, gripMaterial, limbMaterial) {
    const grip = this.createMesh(bowGripGeo, gripMaterial);
    rig.add(grip);

    const upperLimb = this.createMesh(bowLimbGeo, limbMaterial);
    upperLimb.position.set(0.07, 0.18, 0);
    upperLimb.rotation.z = -0.42;
    rig.add(upperLimb);

    const lowerLimb = this.createMesh(bowLimbGeo, limbMaterial);
    lowerLimb.position.set(0.07, -0.18, 0);
    lowerLimb.rotation.z = 0.42;
    rig.add(lowerLimb);

    const bowString = this.createMesh(bowStringGeo, limbMaterial);
    bowString.position.set(0.14, 0, 0);
    rig.add(bowString);
  }

  buildQuiver(rig, quiverGeo, arrowGeo, fletchGeo, quiverMaterial, arrowMaterial) {
    const quiver = this.createMesh(quiverGeo, quiverMaterial);
    rig.add(quiver);

    const arrowOffsets = [-0.025, 0, 0.025];
    for (const x of arrowOffsets) {
      const arrow = this.createMesh(arrowGeo, arrowMaterial);
      arrow.position.set(x, 0.15, 0);
      rig.add(arrow);

      const fletch = this.createMesh(fletchGeo, arrowMaterial);
      fletch.position.set(x, 0.3, 0);
      rig.add(fletch);
    }
  }

  buildHipBlade(rig, scabbardGeo, bladeTipGeo, hiltGeo, crossGuardGeo, pommelGeo, scabbardMaterial, metalMaterial) {
    const scabbard = this.createMesh(scabbardGeo, scabbardMaterial);
    scabbard.position.set(0, -0.18, 0);
    rig.add(scabbard);

    const bladeTip = this.createMesh(bladeTipGeo, metalMaterial);
    bladeTip.position.set(0, -0.45, 0);
    bladeTip.rotation.x = Math.PI;
    rig.add(bladeTip);

    const hilt = this.createMesh(hiltGeo, metalMaterial);
    hilt.position.set(0, 0.14, 0);
    rig.add(hilt);

    const crossGuard = this.createMesh(crossGuardGeo, metalMaterial);
    crossGuard.position.set(0, 0.06, 0);
    rig.add(crossGuard);

    const pommel = this.createMesh(pommelGeo, metalMaterial);
    pommel.position.set(0, 0.23, 0);
    rig.add(pommel);
  }

  createMaterial(params, bucket) {
    const material = new THREE.MeshStandardMaterial(params);
    this.materials.add(material);
    const entry = {
      material,
      baseColor: material.color.clone(),
      baseEmissive: material.emissive.clone(),
      baseEmissiveIntensity: material.emissiveIntensity,
    };
    if (bucket === "surface") this.surfaceMaterials.push(entry);
    else this.focusMaterials.push(entry);
    return material;
  }

  createMesh(geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  trackGeometry(geometry) {
    this.geometries.add(geometry);
    return geometry;
  }

  updateMaterialFeedback(state, hpRatio, hasIFrames) {
    const hurtMix = Math.min(1, this.hurtTimer / 0.22);
    const lowHpMix = hpRatio < 0.38 ? (0.38 - hpRatio) / 0.38 : 0;

    for (const entry of this.surfaceMaterials) {
      entry.material.color.copy(entry.baseColor);
      if (lowHpMix > 0) entry.material.color.lerp(this.lowHpColor, lowHpMix * 0.16);
      if (hurtMix > 0) entry.material.color.lerp(this.hurtColor, hurtMix * 0.68);
      entry.material.emissive.copy(entry.baseEmissive);
      entry.material.emissiveIntensity = entry.baseEmissiveIntensity;
    }

    for (const entry of this.focusMaterials) {
      entry.material.color.copy(entry.baseColor);
      entry.material.emissive.copy(entry.baseEmissive);

      let targetIntensity = 0.55;
      if (state === "sprinting") targetIntensity = 0.95;
      if (state === "dodging") targetIntensity = hasIFrames ? 1.9 : 1.2;
      if (lowHpMix > 0) targetIntensity = Math.max(targetIntensity, 0.85 + lowHpMix * 0.45);
      if (hurtMix > 0) targetIntensity = Math.max(targetIntensity, 1.65 * hurtMix);
      if (state === "dying" || state === "dead") targetIntensity *= 0.22;

      const pulse = Math.max(0, Math.sin(this.elapsed * (state === "dodging" ? 18 : 10))) * 0.3;
      entry.material.emissiveIntensity = targetIntensity + pulse;

      if (state === "sprinting") {
        entry.material.color.lerp(this.sprintColor, 0.5);
        entry.material.emissive.lerp(this.sprintColor, 0.6);
      }
      if (state === "dodging") {
        entry.material.color.lerp(this.dodgeColor, hasIFrames ? 0.7 : 0.4);
        entry.material.emissive.lerp(this.dodgeColor, hasIFrames ? 0.85 : 0.55);
      }
      if (lowHpMix > 0) {
        entry.material.color.lerp(this.lowHpColor, lowHpMix * 0.55);
        entry.material.emissive.lerp(this.lowHpColor, lowHpMix * 0.45);
      }
      if (hurtMix > 0) {
        entry.material.color.lerp(this.hurtColor, hurtMix * 0.9);
        entry.material.emissive.lerp(this.hurtColor, hurtMix * 0.95);
      }
    }
  }
}
