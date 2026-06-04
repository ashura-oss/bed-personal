import * as THREE from "three";

// ── Config ────────────────────────────────────────────────────────────────────

export const BOSS_MAX_HP = 600;
const PHASE2_THRESHOLD = 0.6; // 60% HP triggers phase 2
const PHASE3_THRESHOLD = 0.3; // 30% HP triggers phase 3

const ATTACK_RANGE = 2.8;
const AGGRO_RANGE = 14;
const PHASE1_ATTACK_COOLDOWN = 2.2;
const PHASE2_ATTACK_COOLDOWN = 1.5;
const PHASE3_ATTACK_COOLDOWN = 0.9;
const MOVE_SPEED_P1 = 2.5;
const MOVE_SPEED_P2 = 3.5;
const MOVE_SPEED_P3 = 4.8;
const ATTACK_DAMAGE_LIGHT = 25;
const ATTACK_DAMAGE_HEAVY = 55;
const STAGGER_POISE = 80; // poise pool; depleted by heavy attacks
const STAGGER_DURATION = 1.2;
const EMBERS_REWARD = 600;
const CAPSULE_RADIUS = 0.5;
const CAPSULE_HALF_HEIGHT = 0.65;

/**
 * BossController — the Hollowbound Caravan Guard. A 3-phase boss with an
 * approach → windup → attack → recovery state machine, poise/stagger, and a
 * loop-driven death dissolve. Built from readable greybox primitives (cloak,
 * helm, shield, broken blade, glowing Worldheart wound).
 */
export class BossController {
  phase = 1;
  hp = BOSS_MAX_HP;
  poise = STAGGER_POISE;
  state = "idle";
  dissolveTimer = 0; // >0 means death animation is playing
  timer = 0;
  attackCD = PHASE1_ATTACK_COOLDOWN;
  pendingAttack = "sweep";
  tmp = new THREE.Vector3();

  constructor(scene, rapier, position, callbacks) {
    this.scene = scene;
    this.rapier = rapier;
    this.callbacks = callbacks;

    // ── Mesh — Hollowbound Caravan Guard, built from readable primitives ───
    const bodyGeo = new THREE.BoxGeometry(0.82, 1.28, 0.68);
    this.material = new THREE.MeshStandardMaterial({ color: 0x2a1a0e, roughness: 0.78, metalness: 0.42 });
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.material);
    this.bodyMesh.position.y = 0.12;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;

    const clothMat = new THREE.MeshStandardMaterial({ color: 0x3a0f0c, roughness: 0.92, metalness: 0.0 });
    const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x35323a, roughness: 0.64, metalness: 0.52 });
    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x4a3820, roughness: 0.65, metalness: 0.5 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0x7c5a24, roughness: 0.66, metalness: 0.42 });
    this.bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x5f6870, roughness: 0.46, metalness: 0.74 });
    this.shardMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9b31, emissive: 0xff4a0f, emissiveIntensity: 2.2, roughness: 0.42, metalness: 0.0,
    });

    // Cloak gives the guard a former-caravan-protector silhouette instead of a pill.
    const cloak = new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.38, 0.18), clothMat);
    cloak.name = "guard-torn-cloak";
    cloak.position.set(0, 0.02, -0.42);
    cloak.rotation.x = -0.08;
    cloak.castShadow = true;

    const waist = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.22, 0.78), brassMat);
    waist.name = "guard-belt";
    waist.position.y = -0.58;
    waist.castShadow = true;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.42), darkIronMat);
    head.name = "guard-helmet";
    head.position.set(0, 0.93, 0.02);
    head.castShadow = true;

    const helmCrest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.56), brassMat);
    helmCrest.name = "guard-helmet-crest";
    helmCrest.position.set(0, 1.16, 0.0);
    helmCrest.castShadow = true;

    // Shoulder armour plates
    const shoulderGeo = new THREE.BoxGeometry(0.48, 0.24, 0.44);
    const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    leftShoulder.position.set(-0.66, 0.54, 0);
    leftShoulder.rotation.z = -0.18;
    leftShoulder.castShadow = true;

    const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    rightShoulder.position.set(0.66, 0.54, 0);
    rightShoulder.rotation.z = 0.18;
    rightShoulder.castShadow = true;

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.78, 0.24), darkIronMat);
    leftArm.name = "guard-shield-arm";
    leftArm.position.set(-0.78, 0.02, 0.08);
    leftArm.rotation.z = -0.22;
    leftArm.castShadow = true;

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.86, 0.24), darkIronMat);
    rightArm.name = "guard-sword-arm";
    rightArm.position.set(0.78, 0.02, 0.1);
    rightArm.rotation.z = 0.18;
    rightArm.castShadow = true;

    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.16, 8), darkIronMat);
    shield.name = "guard-caravan-shield";
    shield.position.set(-1.02, 0.08, 0.42);
    shield.rotation.z = Math.PI / 2;
    shield.rotation.y = 0.18;
    shield.castShadow = true;

    const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.035, 6, 16), brassMat);
    shieldRim.name = "guard-shield-rim";
    shieldRim.position.copy(shield.position);
    shieldRim.rotation.copy(shield.rotation);
    shieldRim.castShadow = true;

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.42, 0.12), this.bladeMaterial);
    blade.name = "guard-broken-blade";
    blade.position.set(1.06, 0.12, 0.52);
    blade.rotation.z = -0.4;
    blade.castShadow = true;

    const bladeTip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 4), this.bladeMaterial);
    bladeTip.name = "guard-broken-blade-tip";
    bladeTip.position.set(1.33, 0.78, 0.52);
    bladeTip.rotation.z = -0.4;
    bladeTip.castShadow = true;

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.82, 0.32), darkIronMat);
    leftLeg.name = "guard-left-greave";
    leftLeg.position.set(-0.27, -0.98, 0.02);
    leftLeg.castShadow = true;

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.82, 0.32), darkIronMat);
    rightLeg.name = "guard-right-greave";
    rightLeg.position.set(0.27, -0.98, 0.02);
    rightLeg.castShadow = true;

    const chestShard = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), this.shardMaterial);
    chestShard.name = "guard-worldheart-wound";
    chestShard.position.set(0.04, 0.24, 0.43);

    // Hollow eye glow
    const eyeGeo = new THREE.SphereGeometry(0.09, 6, 4);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ddaa, emissiveIntensity: 3 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.13, 0.96, 0.25);
    rightEye.position.set(0.13, 0.96, 0.25);

    this.group = new THREE.Group();
    this.group.add(
      cloak, this.bodyMesh, waist, head, helmCrest, leftShoulder, rightShoulder,
      leftArm, rightArm, shield, shieldRim, blade, bladeTip, leftLeg, rightLeg,
      chestShard, leftEye, rightEye,
    );
    this.group.position.set(position.x, position.y + CAPSULE_RADIUS + CAPSULE_HALF_HEIGHT, position.z);
    scene.add(this.group);

    // ── Rapier collider ───────────────────────────────────────────────────
    const bodyDesc = this.rapier.module.RigidBodyDesc.fixed().setTranslation(
      position.x,
      position.y + CAPSULE_RADIUS + CAPSULE_HALF_HEIGHT,
      position.z,
    );
    const rb = this.rapier.world.createRigidBody(bodyDesc);
    this.rapier.world.createCollider(
      this.rapier.module.ColliderDesc.capsule(CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS),
      rb,
    );
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  get position() {
    return this.group.position;
  }

  get currentPhase() {
    return this.phase;
  }

  get hpRatio() {
    return this.hp / BOSS_MAX_HP;
  }

  get isAlive() {
    return this.state !== "dead";
  }

  get currentState() {
    return this.state;
  }

  /** Apply poise damage (heavy/charged attacks). Returns true if staggered. */
  applyPoiseDamage(amount) {
    if (this.state === "staggered" || this.state === "dead") return false;
    this.poise -= amount;
    if (this.poise <= 0) {
      this.poise = STAGGER_POISE;
      this.enterStagger();
      return true;
    }
    return false;
  }

  /** Damage the boss. Returns whether a phase transition was triggered. */
  hit(damage, poiseDamage = 0) {
    if (this.state === "dead") return false;
    this.hp = Math.max(0, this.hp - damage);
    this.callbacks.onHpChanged(this.hp, BOSS_MAX_HP, this.phase);
    if (poiseDamage > 0) this.applyPoiseDamage(poiseDamage);

    // Flash red on hit
    this.material.emissive.setHex(0xff1100);
    this.material.emissiveIntensity = 0.9;
    setTimeout(() => {
      if (this.state !== "dead") {
        this.material.emissive.setHex(this.phaseEmissive());
        this.material.emissiveIntensity = this.phaseEmissiveIntensity();
      }
    }, 120);

    if (this.hp <= 0) {
      this.die();
      return false;
    }

    // Phase transitions
    const prevPhase = this.phase;
    if (this.phase < 2 && this.hp / BOSS_MAX_HP <= PHASE2_THRESHOLD) {
      this.enterPhase(2);
    } else if (this.phase < 3 && this.hp / BOSS_MAX_HP <= PHASE3_THRESHOLD) {
      this.enterPhase(3);
    }
    return this.phase !== prevPhase;
  }

  /** Main update — AI state machine. */
  update(dt, playerPos, playerHasIFrames) {
    if (this.state === "dead") return;
    this.timer -= dt;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    const dist = toPlayer.length();

    // Always face the player
    if (dist > 0.1) {
      const angle = Math.atan2(toPlayer.x, toPlayer.z);
      let d = angle - this.group.rotation.y;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      this.group.rotation.y += d * 0.06;
    }

    // Death dissolve driven by the game loop (no rAF)
    if (this.dissolveTimer > 0) {
      this.dissolveTimer -= dt;
      const progress = Math.max(0, 1 - this.dissolveTimer / 1.5);
      this.group.scale.setScalar(Math.max(0.02, 1 - progress * 0.98));
      if (this.dissolveTimer <= 0) this.group.visible = false;
    }

    switch (this.state) {
      case "idle":
        if (dist <= AGGRO_RANGE) this.state = "approach";
        break;
      case "approach":
        this.moveTowardPlayer(dt, toPlayer, dist);
        if (this.timer <= 0 && dist <= ATTACK_RANGE) {
          this.startWindup();
        }
        break;
      case "windup":
        if (this.timer <= 0) {
          this.state = "attack";
          this.timer = 0.18;
          this.fireAttack(playerPos, playerHasIFrames);
        }
        break;
      case "attack":
        if (this.timer <= 0) {
          this.state = "recovery";
          this.timer = this.attackCD;
        }
        break;
      case "recovery":
        // Move slowly during recovery
        this.moveTowardPlayer(dt * 0.3, toPlayer, dist);
        if (this.timer <= 0) {
          this.state = "approach";
        }
        break;
      case "staggered":
        if (this.timer <= 0) {
          this.state = "recovery";
          this.timer = 0.4;
          this.material.emissive.setHex(this.phaseEmissive());
          this.material.emissiveIntensity = this.phaseEmissiveIntensity();
        }
        break;
      case "phaseTransition":
        if (this.timer <= 0) {
          this.state = "approach";
          this.attackCD = this.phaseAttackCooldown();
        }
        break;
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          for (const material of child.material) material.dispose();
        } else {
          child.material.dispose();
        }
      }
    });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  moveTowardPlayer(dt, toPlayer, dist) {
    if (dist < 0.5) return;
    const speed = this.phaseSpeed();
    this.tmp.copy(toPlayer).normalize().multiplyScalar(speed * dt);
    this.group.position.add(this.tmp);
  }

  startWindup() {
    this.state = "windup";
    this.pendingAttack = this.pickAttack();
    this.timer = this.pendingAttack === "charge" ? 0.55 : 0.35;

    // Glow during windup
    this.material.emissive.setHex(0xff8800);
    this.material.emissiveIntensity = 0.6;
    this.bladeMaterial.emissive.setHex(0xff7a20);
    this.bladeMaterial.emissiveIntensity = 1.8;
    this.shardMaterial.emissiveIntensity = 4.0;
  }

  fireAttack(playerPos, playerHasIFrames) {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    const dist = toPlayer.length();

    let damage = 0;
    if (dist <= ATTACK_RANGE + 0.5) {
      if (this.pendingAttack === "sweep") damage = ATTACK_DAMAGE_LIGHT;
      else if (this.pendingAttack === "charge") damage = ATTACK_DAMAGE_HEAVY;
      else damage = ATTACK_DAMAGE_HEAVY + 15;
    }

    if (damage > 0) {
      this.callbacks.onAttack(this.pendingAttack, playerHasIFrames ? 0 : damage);
    }

    this.material.emissive.setHex(this.phaseEmissive());
    this.material.emissiveIntensity = this.phaseEmissiveIntensity();
    this.bladeMaterial.emissive.setHex(0x000000);
    this.bladeMaterial.emissiveIntensity = 0;
    this.shardMaterial.emissiveIntensity = this.phase === 1 ? 2.2 : this.phase === 2 ? 3.2 : 4.6;
  }

  enterStagger() {
    this.state = "staggered";
    this.timer = STAGGER_DURATION;
    this.material.emissive.setHex(0x00ffdd);
    this.material.emissiveIntensity = 1.2;
    this.callbacks.onStaggered();
  }

  enterPhase(phase) {
    this.phase = phase;
    this.state = "phaseTransition";
    this.timer = 1.8;
    this.poise = STAGGER_POISE;
    this.attackCD = this.phaseAttackCooldown();
    this.material.color = new THREE.Color(this.phaseColor());
    this.material.emissive.setHex(this.phaseEmissive());
    this.material.emissiveIntensity = this.phaseEmissiveIntensity();
    this.shardMaterial.emissiveIntensity = phase === 2 ? 3.2 : 4.6;
    this.callbacks.onPhaseChanged(phase);
    this.callbacks.onHpChanged(this.hp, BOSS_MAX_HP, phase);
  }

  die() {
    this.state = "dead";
    this.dissolveTimer = 1.5; // 1.5s dissolve, driven by update()
    this.material.emissive.setHex(0xffd080);
    this.material.emissiveIntensity = 2;
    this.callbacks.onDied(EMBERS_REWARD);
  }

  pickAttack() {
    const r = Math.random();
    if (this.phase === 1) return r < 0.7 ? "sweep" : "charge";
    if (this.phase === 2) return r < 0.5 ? "sweep" : r < 0.8 ? "charge" : "guardBreak";
    return r < 0.35 ? "sweep" : r < 0.65 ? "charge" : "guardBreak";
  }

  phaseColor() {
    return this.phase === 1 ? 0x2a1a0e : this.phase === 2 ? 0x1a0a04 : 0x0a0206;
  }

  phaseEmissive() {
    return this.phase === 1 ? 0x000000 : this.phase === 2 ? 0x220800 : 0x440010;
  }

  phaseEmissiveIntensity() {
    return this.phase === 1 ? 0 : this.phase === 2 ? 0.3 : 0.7;
  }

  phaseSpeed() {
    return this.phase === 1 ? MOVE_SPEED_P1 : this.phase === 2 ? MOVE_SPEED_P2 : MOVE_SPEED_P3;
  }

  phaseAttackCooldown() {
    return this.phase === 1 ? PHASE1_ATTACK_COOLDOWN : this.phase === 2 ? PHASE2_ATTACK_COOLDOWN : PHASE3_ATTACK_COOLDOWN;
  }
}
