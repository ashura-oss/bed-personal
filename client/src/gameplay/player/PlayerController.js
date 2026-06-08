import * as THREE from "three";
import { Action } from "../../controls/InputMap.js";
import { PlayerVisual } from "./PlayerVisual.js";

// ── Config ────────────────────────────────────────────────────────────────────

const CAPSULE_RADIUS = 0.35;
const CAPSULE_HALF_HEIGHT = 0.55;
const WALK_SPEED = 4.5;
const SPRINT_SPEED = 8.0;
const GRAVITY = -22;
const DODGE_SPEED = 13;
const DODGE_DURATION = 0.38;
const DODGE_IFRAME_RATIO = 0.68; // first 68% of dodge grants phase invulnerability
const DODGE_STAMINA_COST = 25;
const SPRINT_STAMINA_RATE = 12; // per second while sprinting
const FLASK_HEAL = 45;
const FLASK_MAX_CHARGES = 4;
const RESPAWN_DELAY = 2.6; // seconds of UNMADE banner before respawn

// Height of body centre above ground
const SPAWN_HEIGHT = CAPSULE_RADIUS + CAPSULE_HALF_HEIGHT + 0.05;

/**
 * PlayerController — kinematic character (Rapier KCC) with camera-relative
 * movement, sprint, dodge invulnerability, flask healing, gravity, and the
 * death → respawn loop. Visuals are delegated to PlayerVisual; resource state
 * lives in the injected StaminaSystem / ResourceBars.
 */
export class PlayerController {
  flaskCharges = FLASK_MAX_CHARGES;
  state = "idle";
  velocityY = 0;
  moveDir = new THREE.Vector3();
  dodgeDir = new THREE.Vector3();
  dodgeTimer = 0;
  dyingTimer = 0;
  hasIFrames = false;
  respawnPoint = new THREE.Vector3(0, SPAWN_HEIGHT, 0);
  deathPos = new THREE.Vector3();
  tmp = new THREE.Vector3();

  constructor(scene, rapier, callbacks, stamina, hp, fp, startPos = { x: 0, y: SPAWN_HEIGHT, z: 3 }) {
    this.scene = scene;
    this.rapier = rapier;
    this.callbacks = callbacks;
    this.stamina = stamina;
    this.hp = hp;
    this.fp = fp;

    // ── Three.js mesh ──────────────────────────────────────────────────────
    this.group = new THREE.Group();
    this.visual = new PlayerVisual();
    this.group.add(this.visual.root);
    scene.add(this.group);

    // ── Rapier KCC ─────────────────────────────────────────────────────────
    const bodyDesc = this.rapier.module.RigidBodyDesc.kinematicPositionBased().setTranslation(
      startPos.x,
      startPos.y,
      startPos.z,
    );
    this.body = this.rapier.world.createRigidBody(bodyDesc);

    const colDesc = this.rapier.module.ColliderDesc.capsule(CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS)
      .setFriction(0)
      .setRestitution(0);
    this.collider = this.rapier.world.createCollider(colDesc, this.body);

    this.kcc = this.rapier.world.createCharacterController(0.01);
    this.kcc.setUp({ x: 0, y: 1, z: 0 });
    this.kcc.setMaxSlopeClimbAngle(45 * (Math.PI / 180));
    this.kcc.setMinSlopeSlideAngle(45 * (Math.PI / 180));
    this.kcc.enableAutostep(0.5, 0.2, true);
    this.kcc.enableSnapToGround(0.4);

    this.respawnPoint.set(startPos.x, startPos.y, startPos.z);
    this.syncMeshToBody();
    this.visual.update(0, this.state, this.hp.ratio, this.hasIFrames);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  get position() {
    return this.group.position;
  }

  get isAlive() {
    return this.state !== "dead" && this.state !== "dying";
  }

  get hasIframes() {
    return this.hasIFrames;
  }

  setRespawnPoint(pos) {
    this.respawnPoint.copy(pos);
    this.respawnPoint.y += SPAWN_HEIGHT;
  }

  /** Called when a Hearthlight rest fully restores the player. */
  fullRestore() {
    this.hp.restoreAll();
    this.fp.restoreAll();
    this.stamina.restoreAll();
    this.flaskCharges = FLASK_MAX_CHARGES;
    this.visual.reset();
    this.callbacks.onHpChanged(this.hp.value, this.hp.max);
    this.callbacks.onFpChanged(this.fp.value, this.fp.max);
    this.callbacks.onStaminaChanged(this.stamina.value, this.stamina.max);
    this.callbacks.onFlaskUsed(this.flaskCharges);
  }

  teleportTo(pos) {
    const target = {
      x: pos.x,
      y: pos.y + SPAWN_HEIGHT,
      z: pos.z
    };

    this.velocityY = 0;
    this.state = "idle";
    this.hasIFrames = false;

    if (typeof this.body.setTranslation === "function") {
      this.body.setTranslation(target, true);
    }
    this.body.setNextKinematicTranslation(target);
    this.group.position.set(target.x, target.y, target.z);
    this.visual.reset();
    this.visual.update(0, this.state, this.hp.ratio, this.hasIFrames);
  }

  /** Called externally when the player takes damage (from an enemy, trap, etc.). */
  takeDamage(amount) {
    if (!this.isAlive) return;
    if (this.hasIFrames) return; // phase invulnerability blocks damage

    this.hp.damage(amount);
    this.visual.flashDamage();
    this.callbacks.onHpChanged(this.hp.value, this.hp.max);
    if (this.hp.isEmpty) {
      this.triggerDeath();
    }
  }

  // ── Frame update ───────────────────────────────────────────────────────────

  update(dt, input, cameraForward, cameraRight, controlLocked) {
    if (this.state === "dead") {
      this.syncPresentation(dt);
      return;
    }

    // Dying countdown → respawn
    if (this.state === "dying") {
      this.dyingTimer -= dt;
      if (this.dyingTimer <= 0) {
        this.doRespawn();
      }
      this.syncPresentation(dt);
      return;
    }

    // ── Resources update ───────────────────────────────────────────────────
    if (this.stamina.update(dt)) {
      this.callbacks.onStaminaChanged(this.stamina.value, this.stamina.max);
    }

    if (controlLocked) {
      this.velocityY = Math.max(GRAVITY * dt, this.velocityY + GRAVITY * dt);
      this.applyGravityOnly(dt);
      this.syncPresentation(dt);
      return;
    }

    // ── Action inputs ──────────────────────────────────────────────────────
    const axes = input.getAxes();

    if (this.state === "dodging") {
      this.updateDodge(dt);
    } else if (input.isJustPressed(Action.Dodge) && this.stamina.canSpend(DODGE_STAMINA_COST)) {
      this.startDodge(axes, cameraForward, cameraRight);
    } else if (input.isJustPressed(Action.UseFlask) && this.flaskCharges > 0 && !this.hp.isFull) {
      this.useFlask();
    }

    // Regular movement (not while dodging)
    if (this.state !== "dodging") {
      this.updateMovement(dt, axes, cameraForward, cameraRight, input);
    }

    this.syncPresentation(dt);
  }

  dispose() {
    this.scene.remove(this.group);
    this.visual.dispose();
    this.rapier.world.removeCollider(this.collider, false);
    this.rapier.world.removeRigidBody(this.body);
    this.rapier.world.removeCharacterController(this.kcc);
  }

  // ── Private movement ───────────────────────────────────────────────────────

  updateMovement(dt, axes, camForward, camRight, input) {
    // Compute world-space move direction from camera-relative axes
    this.moveDir.set(0, 0, 0);
    this.moveDir.addScaledVector(camForward, axes.forward);
    this.moveDir.addScaledVector(camRight, axes.right);
    this.moveDir.y = 0;
    const hasInput = this.moveDir.lengthSq() > 0.001;
    if (hasInput) this.moveDir.normalize();

    // Sprint
    const isSprinting = input.isHeld(Action.Sprint) && hasInput;
    if (isSprinting && !this.stamina.isEmpty) {
      this.stamina.spend(SPRINT_STAMINA_RATE * dt);
    }
    const canSprint = isSprinting && !this.stamina.isEmpty;
    const speed = canSprint ? SPRINT_SPEED : WALK_SPEED;
    const vx = this.moveDir.x * speed;
    const vz = this.moveDir.z * speed;

    // Gravity
    const grounded = this.kcc.computedGrounded();
    if (grounded) {
      this.velocityY = 0;
    } else {
      this.velocityY += GRAVITY * dt;
    }
    const vy = this.velocityY;

    // Compute & apply movement
    this.kcc.computeColliderMovement(
      this.collider,
      { x: vx * dt, y: vy * dt, z: vz * dt },
      this.rapier.module.QueryFilterFlags.EXCLUDE_SENSORS,
    );
    const computed = this.kcc.computedMovement();
    const pos = this.body.translation();
    this.body.setNextKinematicTranslation({
      x: pos.x + computed.x,
      y: pos.y + computed.y,
      z: pos.z + computed.z,
    });

    // Rotate mesh to face movement direction
    if (hasInput) {
      const targetAngle = Math.atan2(this.moveDir.x, this.moveDir.z);
      const current = this.group.rotation.y;
      let diff = targetAngle - current;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      this.group.rotation.y += diff * 0.18;
    }

    this.state = hasInput ? (canSprint ? "sprinting" : "moving") : "idle";
  }

  applyGravityOnly(dt) {
    const grounded = this.kcc.computedGrounded();
    if (grounded) {
      this.velocityY = 0;
      return;
    }
    this.velocityY += GRAVITY * dt;
    this.kcc.computeColliderMovement(
      this.collider,
      { x: 0, y: this.velocityY * dt, z: 0 },
      this.rapier.module.QueryFilterFlags.EXCLUDE_SENSORS,
    );
    const computed = this.kcc.computedMovement();
    const pos = this.body.translation();
    this.body.setNextKinematicTranslation({
      x: pos.x + computed.x,
      y: pos.y + computed.y,
      z: pos.z + computed.z,
    });
  }

  startDodge(axes, camForward, camRight) {
    this.stamina.spend(DODGE_STAMINA_COST);

    // Dodge direction = current move direction (or backward if no input)
    this.dodgeDir.set(0, 0, 0);
    this.dodgeDir.addScaledVector(camForward, axes.forward);
    this.dodgeDir.addScaledVector(camRight, axes.right);
    this.dodgeDir.y = 0;
    if (this.dodgeDir.lengthSq() < 0.01) {
      // Back-step dodge if no directional input
      this.tmp.copy(camForward).negate();
      this.dodgeDir.copy(this.tmp);
    }
    this.dodgeDir.normalize();
    this.dodgeTimer = DODGE_DURATION;
    this.hasIFrames = true;
    this.state = "dodging";
    this.callbacks.onDodgeStart();
  }

  updateDodge(dt) {
    this.dodgeTimer -= dt;
    if (this.dodgeTimer <= 0) {
      this.hasIFrames = false;
      this.state = "idle";
      this.callbacks.onDodgeEnd();
      return;
    }

    // Phase invulnerability ends partway through the dodge.
    const progress = 1 - this.dodgeTimer / DODGE_DURATION;
    this.hasIFrames = progress < DODGE_IFRAME_RATIO;

    // Gravity
    const grounded = this.kcc.computedGrounded();
    if (grounded) this.velocityY = 0;
    else this.velocityY += GRAVITY * dt;

    const vx = this.dodgeDir.x * DODGE_SPEED;
    const vz = this.dodgeDir.z * DODGE_SPEED;
    const vy = this.velocityY;

    this.kcc.computeColliderMovement(
      this.collider,
      { x: vx * dt, y: vy * dt, z: vz * dt },
      this.rapier.module.QueryFilterFlags.EXCLUDE_SENSORS,
    );
    const computed = this.kcc.computedMovement();
    const pos = this.body.translation();
    this.body.setNextKinematicTranslation({
      x: pos.x + computed.x,
      y: pos.y + computed.y,
      z: pos.z + computed.z,
    });
  }

  useFlask() {
    this.flaskCharges -= 1;
    this.hp.heal(FLASK_HEAL);
    this.callbacks.onHpChanged(this.hp.value, this.hp.max);
    this.callbacks.onFlaskUsed(this.flaskCharges);
  }

  triggerDeath() {
    this.deathPos.copy(this.group.position);
    this.state = "dying";
    this.dyingTimer = RESPAWN_DELAY;
    this.hasIFrames = false;
    this.callbacks.onDied(this.deathPos.clone());
  }

  doRespawn() {
    this.hp.restoreAll();
    this.fp.restoreAll();
    this.stamina.restoreAll();
    this.flaskCharges = FLASK_MAX_CHARGES;
    this.velocityY = 0;
    this.state = "idle";
    this.hasIFrames = false;
    this.body.setNextKinematicTranslation(this.respawnPoint);
    this.syncMeshToBody();
    this.visual.reset();
    this.callbacks.onHpChanged(this.hp.value, this.hp.max);
    this.callbacks.onFpChanged(this.fp.value, this.fp.max);
    this.callbacks.onStaminaChanged(this.stamina.value, this.stamina.max);
    this.callbacks.onFlaskUsed(this.flaskCharges);
    this.callbacks.onRespawned();
  }

  syncMeshToBody() {
    const t = this.body.translation();
    this.group.position.set(t.x, t.y, t.z);
  }

  syncPresentation(dt) {
    this.syncMeshToBody();
    this.visual.update(dt, this.state, this.hp.ratio, this.hasIFrames);
  }
}
