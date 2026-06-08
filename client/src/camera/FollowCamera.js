import * as THREE from "three";
import { subscribeCombatFeedback } from "../gameplay/combat/CombatFeedbackSignals.js";
import { clamp } from "../utils/clamp.js";

// ── Config ────────────────────────────────────────────────────────────────────

const MIN_RADIUS = 3.5;
const MAX_RADIUS = 14;
const ROTATE_SPEED = 0.006;
const ZOOM_SPEED = 0.002;
const DAMPING = 0.12;
const LOCKON_DAMPING = 0.06; // slower blend when locking on
const FOLLOW_LERP = 0.15; // how fast the camera chases the player
const HEAD_OFFSET = 0.9; // Y offset: look at player's upper body
const LOOK_AHEAD_MAX = 0.9;
const LOOK_AHEAD_GAIN = 0.09;
const SPEED_LIFT_MAX = 0.18;
const SPEED_ZOOM_MAX = 0.75;
const SPEED_ZOOM_GAIN = 0.08;
const LOCKON_SHOULDER_ANGLE = 0.16;
const LOCKON_SIDE_OFFSET = 0.42;
const LOCKON_TARGET_BLEND = 0.22;
const LOCKON_RADIUS_GAIN = 0.36;
const LOCKON_RADIUS_PAD = 0.5;
const SHAKE_DECAY = 9;
const MAX_SHAKE = 0.4;
const FOV_DAMPING = 0.14;
const SPEED_FOV_GAIN = 0.08;
const MAX_FOV_BOOST = 4.5;

/**
 * FollowCamera — third-person follow camera with optional lock-on.
 *
 * - Replaces the bootstrap OrbitControls.
 * - `setFollowTarget()` must be called each frame BEFORE `update()`.
 * - When a lock-on target is set, theta is driven to face the enemy and
 *   mouse drag is suppressed.
 * - Subscribes to combat feedback to add weighty, decaying camera shake.
 */
export class FollowCamera {
  spherical = new THREE.Spherical(7, Math.PI * 0.42, 0);
  desired = new THREE.Spherical(7, Math.PI * 0.42, 0);
  followTarget = new THREE.Vector3(0, HEAD_OFFSET, 0);
  target = new THREE.Vector3(0, HEAD_OFFSET, 0);
  targetDesired = new THREE.Vector3(0, HEAD_OFFSET, 0);
  lastFollowTarget = new THREE.Vector3(0, HEAD_OFFSET, 0);
  followVelocity = new THREE.Vector3();
  shakeOffset = new THREE.Vector3();
  tmpA = new THREE.Vector3();
  tmpB = new THREE.Vector3();
  tmpC = new THREE.Vector3();
  upAxis = new THREE.Vector3(0, 1, 0);
  lockOnTarget = null;
  lockedOn = false;
  overrideActive = false;
  activePointerId = null;
  lastPointerX = 0;
  lastPointerY = 0;
  lastUpdateMs = 0;
  hasVelocitySample = false;
  manualRadius = 7;
  cameraShakeFovBoost = 0;

  constructor(camera, element) {
    this.camera = camera;
    this.element = element;
    this.spherical.setFromVector3(camera.position.clone().sub(this.target));
    this.desired.copy(this.spherical);
    this.followTarget.copy(this.target);
    this.targetDesired.copy(this.target);
    this.lastFollowTarget.copy(this.target);
    this.manualRadius = this.spherical.radius;
    this.baseFov = camera.fov;
    this.unsubscribeFeedback = subscribeCombatFeedback((signal) => {
      this.onCombatFeedback(signal);
    });
    this.bind();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Point to follow (player root position). */
  setFollowTarget(worldPos) {
    this.followTarget.set(worldPos.x, worldPos.y + HEAD_OFFSET, worldPos.z);
  }

  /** Pass a world-space position to lock onto, or null to release. */
  setLockOn(target) {
    this.lockOnTarget = target ? target.clone() : null;
    this.lockedOn = target !== null;
  }

  /** Update lock-on world position (call each frame when locked). */
  updateLockOnTarget(target) {
    if (this.lockOnTarget) this.lockOnTarget.copy(target);
  }

  get isLockedOn() {
    return this.lockedOn;
  }

  get isOverridden() {
    return this.overrideActive;
  }

  beginOverride() {
    this.overrideActive = true;
    this.activePointerId = null;
  }

  setOverridePose({ position, target, fov } = {}) {
    this.beginOverride();

    if (position) {
      this.camera.position.set(position.x, position.y, position.z);
    }

    if (Number.isFinite(fov)) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    if (target) {
      this.camera.lookAt(target.x, target.y, target.z);
    }
  }

  clearOverride() {
    if (!this.overrideActive) return;

    this.overrideActive = false;
    this.hasVelocitySample = false;
    this.lastUpdateMs = 0;
    if (Math.abs(this.camera.fov - this.baseFov) > 0.01) {
      this.camera.fov = this.baseFov;
      this.camera.updateProjectionMatrix();
    }
  }

  update() {
    if (this.overrideActive) return;

    const dt = this.sampleDeltaSeconds();
    this.sampleFollowVelocity(dt);
    this.composeTargetFraming();

    this.target.lerp(this.targetDesired, this.getFrameLerp(this.lockedOn ? FOLLOW_LERP * 0.85 : FOLLOW_LERP, dt));
    this.desired.phi = clamp(this.desired.phi, 0.35, Math.PI - 0.18);
    this.desired.radius = clamp(this.desired.radius, MIN_RADIUS, MAX_RADIUS);

    const d = this.getFrameLerp(this.lockedOn ? LOCKON_DAMPING : DAMPING, dt);
    this.spherical.theta += (this.desired.theta - this.spherical.theta) * d;
    this.spherical.phi += (this.desired.phi - this.spherical.phi) * d;
    this.spherical.radius += (this.desired.radius - this.spherical.radius) * d;

    this.updateLens(dt);
    this.camera.position.setFromSpherical(this.spherical).add(this.target);
    this.shakeOffset.multiplyScalar(Math.exp(-SHAKE_DECAY * dt));

    const forward = this.tmpA.subVectors(this.target, this.camera.position);
    if (forward.lengthSq() > 0.0001) forward.normalize();
    const right = this.tmpB.crossVectors(forward, this.upAxis);
    if (right.lengthSq() > 0.0001) right.normalize();
    const up = this.tmpC.crossVectors(right, forward);
    if (up.lengthSq() > 0.0001) up.normalize();

    this.camera.position
      .addScaledVector(right, this.shakeOffset.x)
      .addScaledVector(up, this.shakeOffset.y)
      .addScaledVector(forward, this.shakeOffset.z);

    const lookTarget = this.tmpA
      .copy(this.target)
      .addScaledVector(right, this.shakeOffset.x * 0.3)
      .addScaledVector(up, this.shakeOffset.y * 0.18);
    this.camera.lookAt(lookTarget);
  }

  dispose() {
    this.unsubscribeFeedback();
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    this.element.removeEventListener("pointercancel", this.onPointerUp);
    this.element.removeEventListener("wheel", this.onWheel);
  }

  // ── Input handlers (bound arrow fields for stable add/removeEventListener) ──

  onPointerDown = (e) => {
    if (this.activePointerId !== null || this.lockedOn) return;
    this.activePointerId = e.pointerId;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.element.setPointerCapture(e.pointerId);
  };

  onPointerMove = (e) => {
    if (e.pointerId !== this.activePointerId) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.desired.theta -= dx * ROTATE_SPEED;
    this.desired.phi = THREE.MathUtils.clamp(this.desired.phi - dy * ROTATE_SPEED, 0.35, Math.PI - 0.18);
  };

  onPointerUp = (e) => {
    if (e.pointerId !== this.activePointerId) return;
    this.activePointerId = null;
    if (this.element.hasPointerCapture(e.pointerId)) {
      this.element.releasePointerCapture(e.pointerId);
    }
  };

  onWheel = (e) => {
    e.preventDefault();
    this.manualRadius = clamp(this.manualRadius + e.deltaY * ZOOM_SPEED, MIN_RADIUS, MAX_RADIUS);
  };

  // ── Private ────────────────────────────────────────────────────────────────

  bind() {
    this.element.addEventListener("pointerdown", this.onPointerDown);
    this.element.addEventListener("pointermove", this.onPointerMove);
    this.element.addEventListener("pointerup", this.onPointerUp);
    this.element.addEventListener("pointercancel", this.onPointerUp);
    this.element.addEventListener("wheel", this.onWheel, { passive: false });
  }

  sampleDeltaSeconds() {
    const now = performance.now();
    if (this.lastUpdateMs === 0) {
      this.lastUpdateMs = now;
      return 1 / 60;
    }
    const dt = clamp((now - this.lastUpdateMs) / 1000, 1 / 240, 0.05);
    this.lastUpdateMs = now;
    return dt;
  }

  sampleFollowVelocity(dt) {
    if (!this.hasVelocitySample) {
      this.lastFollowTarget.copy(this.followTarget);
      this.followVelocity.set(0, 0, 0);
      this.hasVelocitySample = true;
      return;
    }
    this.followVelocity.copy(this.followTarget).sub(this.lastFollowTarget).multiplyScalar(1 / Math.max(dt, 0.0001));
    this.followVelocity.y = 0;
    this.lastFollowTarget.copy(this.followTarget);
  }

  composeTargetFraming() {
    this.targetDesired.copy(this.followTarget);
    const speed = this.tmpA.copy(this.followVelocity).setY(0).length();

    if (speed > 0.01) {
      const lookAheadDistance = Math.min(LOOK_AHEAD_MAX, speed * LOOK_AHEAD_GAIN);
      this.tmpA.copy(this.followVelocity).setY(0).normalize().multiplyScalar(lookAheadDistance);
      this.targetDesired.add(this.tmpA);
      this.targetDesired.y += THREE.MathUtils.clamp(speed * 0.02, 0, SPEED_LIFT_MAX);
    }

    let desiredRadius = this.manualRadius + THREE.MathUtils.clamp(speed * SPEED_ZOOM_GAIN, 0, SPEED_ZOOM_MAX);

    if (this.lockedOn && this.lockOnTarget) {
      const enemyAnchor = this.tmpA.copy(this.lockOnTarget);
      enemyAnchor.y += HEAD_OFFSET * 0.65;
      const toEnemy = this.tmpB.subVectors(enemyAnchor, this.followTarget);
      const planar = this.tmpC.copy(toEnemy);
      planar.y = 0;
      const planarDistance = planar.length();

      if (planarDistance > 0.001) {
        planar.divideScalar(planarDistance);
        const enemyAngle = Math.atan2(planar.x, planar.z);
        const shoulderSign = Math.sin(this.spherical.theta - enemyAngle) >= 0 ? 1 : -1;
        this.desired.theta = enemyAngle + Math.PI + shoulderSign * LOCKON_SHOULDER_ANGLE;
        this.desired.phi = this.desired.phi * 0.55 + THREE.MathUtils.clamp(1.02 - planarDistance * 0.018, 0.86, 1.16) * 0.45;
        const sideOffset = this.tmpC.set(-planar.z, 0, planar.x).multiplyScalar(LOCKON_SIDE_OFFSET * shoulderSign);
        this.targetDesired.copy(this.followTarget).lerp(enemyAnchor, LOCKON_TARGET_BLEND).add(sideOffset);
        this.targetDesired.y += THREE.MathUtils.clamp(planarDistance * 0.05, 0.12, 0.32);
        desiredRadius = Math.max(desiredRadius, this.manualRadius + LOCKON_RADIUS_PAD + planarDistance * LOCKON_RADIUS_GAIN);
      }
    }

    this.desired.radius = clamp(desiredRadius, MIN_RADIUS, MAX_RADIUS);
  }

  updateLens(dt) {
    const desiredFov = clamp(
      this.baseFov + Math.min(MAX_FOV_BOOST, this.followVelocity.length() * SPEED_FOV_GAIN + this.cameraShakeFovBoost),
      this.baseFov,
      this.baseFov + MAX_FOV_BOOST,
    );
    const nextFov = this.camera.fov + (desiredFov - this.camera.fov) * this.getFrameLerp(FOV_DAMPING, dt);
    this.cameraShakeFovBoost *= Math.exp(-8 * dt);
    if (Math.abs(nextFov - this.camera.fov) > 0.01) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }
  }

  getFrameLerp(base, dt) {
    return 1 - Math.pow(1 - base, dt * 60);
  }

  onCombatFeedback(signal) {
    switch (signal.type) {
      case "attack-start":
        this.addShake(0, 0.008, 0.032 * signal.intensity);
        this.cameraShakeFovBoost = Math.max(this.cameraShakeFovBoost, 0.35 * signal.intensity);
        break;
      case "attack-hit":
        this.addShake(
          this.randomSigned(0.045 * signal.intensity),
          0.028 + (signal.killed ? 0.02 : 0),
          0.11 * signal.intensity,
        );
        this.cameraShakeFovBoost = Math.max(
          this.cameraShakeFovBoost,
          signal.attack === "heavy" || signal.killed ? 1.15 : 0.75,
        );
        break;
      case "attack-miss":
        this.addShake(this.randomSigned(0.018 * signal.intensity), 0.004, 0.038 * signal.intensity);
        break;
      case "dodge":
        this.addShake(this.randomSigned(0.055 * signal.intensity), 0.015, 0.085 * signal.intensity);
        this.cameraShakeFovBoost = Math.max(this.cameraShakeFovBoost, 1.35 * signal.intensity);
        break;
    }
  }

  addShake(x, y, z) {
    const scale = this.getShakeScale();
    this.shakeOffset.x = clamp(this.shakeOffset.x + x * scale, -MAX_SHAKE, MAX_SHAKE);
    this.shakeOffset.y = clamp(this.shakeOffset.y + y * scale, -MAX_SHAKE, MAX_SHAKE);
    this.shakeOffset.z = clamp(this.shakeOffset.z + z * scale, -MAX_SHAKE, MAX_SHAKE);
  }

  getShakeScale() {
    if (typeof document === "undefined" || typeof getComputedStyle !== "function") {
      return 1;
    }
    const reduced = getComputedStyle(document.documentElement).getPropertyValue("--rf-reduce-shake").trim() === "1";
    return reduced ? 0.35 : 1;
  }

  randomSigned(amount) {
    return (Math.random() * 2 - 1) * amount;
  }
}
