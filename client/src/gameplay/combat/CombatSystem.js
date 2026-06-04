import * as THREE from "three";
import { Action } from "../../controls/InputMap.js";
import { emitCombatFeedback } from "./CombatFeedbackSignals.js";

// ── Config ────────────────────────────────────────────────────────────────────

const LIGHT_STARTUP = 0.1; // seconds before hitbox opens
const LIGHT_ACTIVE = 0.15; // seconds hitbox is live
const LIGHT_RECOVERY = 0.28; // seconds after hitbox closes (cannot attack again)
const LIGHT_STAMINA = 18;
const LIGHT_DAMAGE = 22;

const HEAVY_STARTUP = 0.22;
const HEAVY_ACTIVE = 0.18;
const HEAVY_RECOVERY = 0.45;
const HEAVY_STAMINA = 32;
const HEAVY_DAMAGE = 48;

// Attack hit cone (avoid hitting enemies behind the player)
const HIT_RANGE = 2.4; // metres
const HIT_DOT = 0.15; // cos(81°) — very generous front-facing cone

const LIGHT_CONFIG = {
  attack: "light",
  startup: LIGHT_STARTUP,
  active: LIGHT_ACTIVE,
  recovery: LIGHT_RECOVERY,
  stamina: LIGHT_STAMINA,
  damage: LIGHT_DAMAGE,
  intensity: 0.62,
};

const HEAVY_CONFIG = {
  attack: "heavy",
  startup: HEAVY_STARTUP,
  active: HEAVY_ACTIVE,
  recovery: HEAVY_RECOVERY,
  stamina: HEAVY_STAMINA,
  damage: HEAVY_DAMAGE,
  intensity: 1,
};

/**
 * CombatSystem — manages attack timing (startup / active / recovery) and
 * hit detection.
 *
 * Hit detection: simple distance + dot-product check — no Rapier shape cast
 * needed for greybox. Good enough to feel the "commitment" of attacks.
 */
export class CombatSystem {
  phase = "none";
  timer = 0;
  config = LIGHT_CONFIG;
  hitLanded = false;
  tmpToEnemy = new THREE.Vector3();

  constructor(stamina, callbacks) {
    this.stamina = stamina;
    this.callbacks = callbacks;
  }

  get isAttacking() {
    return this.phase !== "none";
  }

  get isInActiveFrames() {
    return this.phase === "active";
  }

  update(dt, input, playerPos, playerForward, enemies, controlLocked) {
    if (controlLocked) return;

    // ── Advance current attack state ───────────────────────────────────────
    if (this.phase !== "none") {
      this.timer -= dt;

      if (this.phase === "startup" && this.timer <= 0) {
        this.phase = "active";
        this.timer = this.config.active;
        this.hitLanded = false;
      } else if (this.phase === "active" && this.timer <= 0) {
        this.phase = "recovery";
        this.timer = this.config.recovery;
      } else if (this.phase === "recovery" && this.timer <= 0) {
        this.phase = "none";
      }

      // Check for hits during the active window
      if (this.phase === "active" && !this.hitLanded) {
        this.checkHits(playerPos, playerForward, enemies);
      }
    }

    // ── New attack input (only when not already attacking) ────────────────
    if (this.phase === "none") {
      if (input.isJustPressed(Action.LightAttack) && this.stamina.canSpend(LIGHT_STAMINA)) {
        this.startAttack(LIGHT_CONFIG);
      } else if (input.isJustPressed(Action.HeavyAttack) && this.stamina.canSpend(HEAVY_STAMINA)) {
        this.startAttack(HEAVY_CONFIG);
      }
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  startAttack(config) {
    this.stamina.spend(config.stamina);
    this.config = config;
    this.phase = "startup";
    this.timer = config.startup;
    this.hitLanded = false;

    emitCombatFeedback({
      type: "attack-start",
      attack: config.attack,
      intensity: config.intensity,
    });
  }

  checkHits(playerPos, playerForward, enemies) {
    let hitAny = false;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      const toEnemy = this.tmpToEnemy.subVectors(enemy.position, playerPos);
      const dist = toEnemy.length();
      if (dist > HIT_RANGE) continue;

      const dot = toEnemy.normalize().dot(playerForward);
      if (dot < HIT_DOT) continue;

      const result = enemy.hit(this.config.damage);
      hitAny = true;

      if (result.embersRewarded > 0) {
        this.callbacks.onEmbersDelta(result.embersRewarded);
      }

      emitCombatFeedback({
        type: "attack-hit",
        attack: this.config.attack,
        intensity: this.config.intensity,
        damage: result.damage,
        killed: result.died,
      });

      this.callbacks.onAttackHit({
        damage: result.damage,
        died: result.died,
        embersRewarded: result.embersRewarded,
      });
    }

    if (!hitAny) {
      emitCombatFeedback({
        type: "attack-miss",
        attack: this.config.attack,
        intensity: this.config.intensity,
      });
      this.callbacks.onAttackMiss();
    }

    this.hitLanded = true;
  }
}
