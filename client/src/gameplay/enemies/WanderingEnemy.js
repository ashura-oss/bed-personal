// ── Constants ─────────────────────────────────────────────────────────────────

const WANDER_RADIUS = 8;       // units — max offset from spawn when picking target
const ARRIVE_THRESHOLD = 0.3;  // units — "close enough" to a target
const WANDER_SPEED = 2;        // units/s
const CHASE_SPEED = 4.5;       // units/s
const RETURN_SPEED = 4;        // units/s

// ── State labels ──────────────────────────────────────────────────────────────

export const STATE = Object.freeze({
  IDLE: "idle",
  WANDER: "wander",
  CHASE: "chase",
  ATTACK: "attack",
  RETURN: "return",
  DEAD: "dead",
});

// ── WanderingEnemy ────────────────────────────────────────────────────────────

/**
 * Pure AI state machine for a light wandering enemy.
 *
 * Zero Three.js / Rapier imports — all position data is plain { x, y, z }
 * objects so the class is fully unit-testable without a WebGL context.
 *
 * Physics / render wiring lives in WanderingEnemyVisual (Three.js layer) or
 * a future WanderingEnemyController (Rapier layer); this class only owns the
 * AI logic.
 */
export class WanderingEnemy {
  // ── Identity / config ──────────────────────────────────────────────────────

  /** @type {string|number} */
  id;

  spawnPoint; // { x, z }

  aggroRange = 10;      // world units
  attackRange = 1.8;    // world units
  returnRange = 25;     // leash range — beyond this, snap back

  ATTACK_DAMAGE = 8;
  ATTACK_COOLDOWN_S = 1.2;

  // ── Runtime state ──────────────────────────────────────────────────────────

  state = STATE.IDLE;

  hp = 30;
  maxHp = 30;

  /** Live world position, updated every tick. y is managed by the visual layer. */
  position; // { x, y, z }

  /** Current wander destination — null when idle / not wandering. */
  wanderTarget = null; // { x, z } | null

  attackCooldown = 0;

  // ── Private ────────────────────────────────────────────────────────────────

  /** mulberry32 PRNG function — seeded per-enemy for determinism. */
  #rng;

  /** Callback invoked once when the enemy dies: onDeath({ enemy }) */
  #onDeath;

  // ── Constructor ────────────────────────────────────────────────────────────

  /**
   * @param {object} opts
   * @param {string|number}   opts.id
   * @param {number}          opts.spawnX
   * @param {number}          opts.spawnZ
   * @param {function():number} opts.rng   - zero-arg function returning [0,1)
   * @param {function({enemy: WanderingEnemy}): void} opts.onDeath
   */
  constructor({ id, spawnX, spawnZ, rng, onDeath }) {
    this.id = id;
    this.spawnPoint = { x: spawnX, z: spawnZ };
    this.position = { x: spawnX, y: 0, z: spawnZ };
    this.#rng = rng;
    this.#onDeath = onDeath ?? (() => {});
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** True once HP reaches zero. */
  get isDead() {
    return this.state === STATE.DEAD;
  }

  /** The current STATE label string. */
  get stateLabel() {
    return this.state;
  }

  /**
   * Main update — advance the AI by `dt` seconds.
   *
   * @param {number} dt - delta time in seconds
   * @param {{ x: number, y: number, z: number } | null} playerPosition - player world position, or null
   */
  update(dt, playerPosition) {
    if (this.state === STATE.DEAD) return;

    // Decay attack cooldown regardless of state so it ticks down while chasing.
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    }

    switch (this.state) {
      case STATE.IDLE:
        this._tickIdle(dt, playerPosition);
        break;
      case STATE.WANDER:
        this._tickWander(dt, playerPosition);
        break;
      case STATE.CHASE:
        this._tickChase(dt, playerPosition);
        break;
      case STATE.ATTACK:
        this._tickAttack(dt, playerPosition);
        break;
      case STATE.RETURN:
        this._tickReturn(dt);
        break;
      default:
        break;
    }
  }

  /**
   * Receive damage. Transitions to DEAD when HP reaches zero and fires onDeath.
   * @param {number} amount
   */
  takeDamage(amount) {
    if (this.state === STATE.DEAD) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.state = STATE.DEAD;
      this.#onDeath({ enemy: this });
    }
  }

  // ── State tick helpers ─────────────────────────────────────────────────────

  _tickIdle(_dt, playerPosition) {
    if (playerPosition && this._dist2D(this.position, playerPosition) <= this.aggroRange) {
      this.state = STATE.CHASE;
      return;
    }
    // Pick a wander target and start wandering.
    this.wanderTarget = this._pickWanderTarget();
    this.state = STATE.WANDER;
  }

  _tickWander(dt, playerPosition) {
    // Aggro check first.
    if (playerPosition && this._dist2D(this.position, playerPosition) <= this.aggroRange) {
      this.state = STATE.CHASE;
      return;
    }

    if (this.wanderTarget === null) {
      this.state = STATE.IDLE;
      return;
    }

    const arrived = this._moveToward(this.wanderTarget, WANDER_SPEED, dt);
    if (arrived) {
      this.wanderTarget = null;
      this.state = STATE.IDLE;
    }
  }

  _tickChase(dt, playerPosition) {
    if (!playerPosition) {
      this.state = STATE.RETURN;
      return;
    }

    const dist = this._dist2D(this.position, playerPosition);

    // Leash check — too far from spawn.
    if (dist > this.returnRange) {
      this.state = STATE.RETURN;
      return;
    }

    if (dist <= this.attackRange) {
      this.state = STATE.ATTACK;
      return;
    }

    this._moveToward(playerPosition, CHASE_SPEED, dt);
  }

  _tickAttack(dt, playerPosition) {
    if (!playerPosition) {
      this.state = STATE.CHASE;
      return;
    }

    // Face the player (no-op in pure logic layer; visual layer handles rotation).

    if (this.attackCooldown <= 0) {
      this._attackPlayer(playerPosition);
      this.attackCooldown = this.ATTACK_COOLDOWN_S;
    }

    const dist = this._dist2D(this.position, playerPosition);
    if (dist > this.attackRange) {
      this.state = STATE.CHASE;
    }
  }

  _tickReturn(_dt) {
    const arrived = this._moveToward(this.spawnPoint, RETURN_SPEED, _dt);
    if (arrived) {
      this.hp = this.maxHp;
      this.state = STATE.IDLE;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Attempt to deal damage to the player object.
   * @param {object} player - any object with an optional `takeDamage(amount)` method
   */
  _attackPlayer(player) {
    if (player && typeof player.takeDamage === "function") {
      player.takeDamage(this.ATTACK_DAMAGE);
    }
  }

  /**
   * Move `this.position` toward `target {x, z}` at `speed` units/s for `dt` seconds.
   * Returns true when arrival threshold is reached.
   *
   * @param {{ x: number, z: number }} target
   * @param {number} speed
   * @param {number} dt
   * @returns {boolean} true if arrived
   */
  _moveToward(target, speed, dt) {
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist <= ARRIVE_THRESHOLD) return true;

    const step = Math.min(speed * dt, dist);
    const inv = step / dist;
    this.position.x += dx * inv;
    this.position.z += dz * inv;

    return dist - step <= ARRIVE_THRESHOLD;
  }

  /**
   * Pick a random wander target within WANDER_RADIUS of the spawn point.
   * Uses the injected seeded PRNG so results are deterministic.
   *
   * @returns {{ x: number, z: number }}
   */
  _pickWanderTarget() {
    const angle = this.#rng() * Math.PI * 2;
    const radius = this.#rng() * WANDER_RADIUS;
    return {
      x: this.spawnPoint.x + Math.cos(angle) * radius,
      z: this.spawnPoint.z + Math.sin(angle) * radius,
    };
  }

  /**
   * 2D (xz-plane) distance between two position-like objects.
   * @param {{ x: number, z: number }} a
   * @param {{ x: number, z: number }} b
   * @returns {number}
   */
  _dist2D(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
