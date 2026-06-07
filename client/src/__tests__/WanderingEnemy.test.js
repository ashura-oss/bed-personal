import { describe, expect, it, jest } from "@jest/globals";
import { WanderingEnemy, STATE } from "../gameplay/enemies/WanderingEnemy.js";
import { mulberry32 } from "../world/gen/Rng.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Factory — fresh enemy at (0, 0) with a fixed seed. */
function makeEnemy(overrides = {}) {
  const defaults = {
    id: "test-enemy",
    spawnX: 0,
    spawnZ: 0,
    rng: mulberry32(42),
    onDeath: jest.fn(),
  };
  return new WanderingEnemy({ ...defaults, ...overrides });
}

/** Player stub at the given (x, z) — optional takeDamage spy. */
function makePlayer(x = 0, z = 0) {
  return { x, y: 0, z, takeDamage: jest.fn() };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("WanderingEnemy — initial state", () => {
  it("starts IDLE", () => {
    const e = makeEnemy();
    expect(e.stateLabel).toBe(STATE.IDLE);
  });

  it("starts at full HP", () => {
    const e = makeEnemy();
    expect(e.hp).toBe(30);
    expect(e.hp).toBe(e.maxHp);
  });

  it("starts at spawn position", () => {
    const e = makeEnemy({ spawnX: 5, spawnZ: -3 });
    expect(e.position.x).toBeCloseTo(5);
    expect(e.position.z).toBeCloseTo(-3);
  });

  it("isDead returns false initially", () => {
    expect(makeEnemy().isDead).toBe(false);
  });
});

describe("WanderingEnemy — IDLE → WANDER", () => {
  it("transitions to WANDER after one update tick", () => {
    const e = makeEnemy();
    const farPlayer = makePlayer(1000, 1000); // outside aggroRange
    e.update(0.016, farPlayer);
    expect(e.stateLabel).toBe(STATE.WANDER);
  });

  it("sets a wanderTarget after the IDLE tick", () => {
    const e = makeEnemy();
    e.update(0.016, makePlayer(1000, 1000));
    expect(e.wanderTarget).not.toBeNull();
    expect(typeof e.wanderTarget.x).toBe("number");
    expect(typeof e.wanderTarget.z).toBe("number");
  });

  it("wander target is within WANDER_RADIUS (8 units) of spawn", () => {
    const e = makeEnemy({ spawnX: 10, spawnZ: 5 });
    e.update(0.016, makePlayer(1000, 1000));
    const dx = e.wanderTarget.x - e.spawnPoint.x;
    const dz = e.wanderTarget.z - e.spawnPoint.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    expect(dist).toBeLessThanOrEqual(8);
  });
});

describe("WanderingEnemy — WANDER → IDLE on arrival", () => {
  it("returns to IDLE when already at the wander target", () => {
    const e = makeEnemy();
    // Force state and target manually to isolate the arrival logic.
    e.state = STATE.WANDER;
    e.wanderTarget = { x: 0, z: 0 }; // same as position — already arrived
    e.update(0.016, makePlayer(1000, 1000));
    expect(e.stateLabel).toBe(STATE.IDLE);
  });
});

describe("WanderingEnemy — WANDER → CHASE on player proximity", () => {
  it("transitions to CHASE when player enters aggroRange", () => {
    const e = makeEnemy();
    e.state = STATE.WANDER;
    e.wanderTarget = { x: 5, z: 5 };

    // aggroRange = 10; player at (3, 0) is within 10 units of spawn (0,0)
    e.update(0.016, makePlayer(3, 0));
    expect(e.stateLabel).toBe(STATE.CHASE);
  });

  it("stays WANDER when player is outside aggroRange", () => {
    const e = makeEnemy();
    e.state = STATE.WANDER;
    e.wanderTarget = { x: 5, z: 5 };

    // Player at (20, 0) is beyond aggroRange=10
    e.update(0.016, makePlayer(20, 0));
    expect(e.stateLabel).toBe(STATE.WANDER);
  });
});

describe("WanderingEnemy — CHASE → ATTACK on close range", () => {
  it("transitions to ATTACK when player enters attackRange", () => {
    const e = makeEnemy();
    e.state = STATE.CHASE;

    // attackRange = 1.8; player at (1, 0) is within 1.8 of spawn (0,0)
    e.update(0.016, makePlayer(1, 0));
    expect(e.stateLabel).toBe(STATE.ATTACK);
  });

  it("keeps chasing when player is between attackRange and aggroRange", () => {
    const e = makeEnemy();
    e.state = STATE.CHASE;

    // Player at (5, 0) — outside attackRange (1.8) but inside aggroRange (10)
    e.update(0.016, makePlayer(5, 0));
    expect(e.stateLabel).toBe(STATE.CHASE);
  });
});

describe("WanderingEnemy — ATTACK deals damage", () => {
  it("calls player.takeDamage(8) when cooldown is zero", () => {
    const e = makeEnemy();
    e.state = STATE.ATTACK;
    e.attackCooldown = 0;

    const player = makePlayer(1, 0);
    e.update(0.016, player);

    expect(player.takeDamage).toHaveBeenCalledWith(8);
  });

  it("resets attackCooldown to ATTACK_COOLDOWN_S after an attack", () => {
    const e = makeEnemy();
    e.state = STATE.ATTACK;
    e.attackCooldown = 0;

    const player = makePlayer(1, 0);
    e.update(0.016, player);

    // Cooldown should have been set then ticked down by dt; still > 0.
    expect(e.attackCooldown).toBeGreaterThan(0);
  });

  it("does not call takeDamage while on cooldown", () => {
    const e = makeEnemy();
    e.state = STATE.ATTACK;
    e.attackCooldown = 1.0; // still cooling down

    const player = makePlayer(1, 0);
    e.update(0.016, player);

    expect(player.takeDamage).not.toHaveBeenCalled();
  });
});

describe("WanderingEnemy — takeDamage", () => {
  it("reduces HP by the damage amount", () => {
    const e = makeEnemy();
    e.takeDamage(10);
    expect(e.hp).toBe(20);
  });

  it("does not drop HP below 0", () => {
    const e = makeEnemy();
    e.takeDamage(100);
    expect(e.hp).toBe(0);
  });

  it("does not reduce HP when already DEAD", () => {
    const e = makeEnemy();
    e.takeDamage(30); // kill
    const hpAfterDeath = e.hp;
    e.takeDamage(10); // should be ignored
    expect(e.hp).toBe(hpAfterDeath);
  });
});

describe("WanderingEnemy — death on HP depletion", () => {
  it("transitions to DEAD state when HP reaches 0", () => {
    const e = makeEnemy();
    e.takeDamage(30);
    expect(e.stateLabel).toBe(STATE.DEAD);
  });

  it("fires onDeath callback with { enemy } reference", () => {
    const onDeath = jest.fn();
    const e = makeEnemy({ onDeath });
    e.takeDamage(30);
    expect(onDeath).toHaveBeenCalledTimes(1);
    expect(onDeath.mock.calls[0][0].enemy).toBe(e);
  });

  it("isDead returns true after death", () => {
    const e = makeEnemy();
    e.takeDamage(30);
    expect(e.isDead).toBe(true);
  });
});

describe("WanderingEnemy — DEAD state is a no-op", () => {
  it("update() on a dead enemy does not change any observable state", () => {
    const onDeath = jest.fn();
    const e = makeEnemy({ onDeath });
    e.takeDamage(30); // kill

    const posSnapshot = { ...e.position };
    onDeath.mockClear(); // don't count the death call itself

    e.update(1.0, makePlayer(0.5, 0));

    expect(e.stateLabel).toBe(STATE.DEAD);
    expect(e.position.x).toBeCloseTo(posSnapshot.x);
    expect(e.position.z).toBeCloseTo(posSnapshot.z);
    expect(onDeath).not.toHaveBeenCalled();
  });
});

describe("WanderingEnemy — RETURN heals to full", () => {
  it("restores maxHp on arrival at spawn point", () => {
    const e = makeEnemy();
    e.state = STATE.RETURN;
    e.hp = 10; // damaged
    // Position already at spawn (0, 0) — will arrive immediately.
    e.update(0.016, null);
    expect(e.hp).toBe(e.maxHp);
  });

  it("transitions to IDLE after arriving at spawn", () => {
    const e = makeEnemy();
    e.state = STATE.RETURN;
    e.hp = 5;
    e.update(0.016, null);
    expect(e.stateLabel).toBe(STATE.IDLE);
  });
});

describe("WanderingEnemy — determinism", () => {
  it("same seed produces the same wander target on the first IDLE tick", () => {
    const rngA = mulberry32(99);
    const rngB = mulberry32(99);

    const eA = makeEnemy({ rng: rngA });
    const eB = makeEnemy({ rng: rngB });

    eA.update(0.016, makePlayer(1000, 1000));
    eB.update(0.016, makePlayer(1000, 1000));

    expect(eA.wanderTarget.x).toBeCloseTo(eB.wanderTarget.x);
    expect(eA.wanderTarget.z).toBeCloseTo(eB.wanderTarget.z);
  });

  it("different seeds produce different wander targets", () => {
    const eA = makeEnemy({ rng: mulberry32(1) });
    const eB = makeEnemy({ rng: mulberry32(9999) });

    eA.update(0.016, makePlayer(1000, 1000));
    eB.update(0.016, makePlayer(1000, 1000));

    // Extremely unlikely to collide with different seeds.
    const same =
      Math.abs(eA.wanderTarget.x - eB.wanderTarget.x) < 0.001 &&
      Math.abs(eA.wanderTarget.z - eB.wanderTarget.z) < 0.001;
    expect(same).toBe(false);
  });
});

describe("WanderingEnemy — leash triggers RETURN", () => {
  it("transitions from CHASE to RETURN when player exceeds returnRange", () => {
    const e = makeEnemy();
    e.state = STATE.CHASE;

    // returnRange = 25; player at (30, 0) is beyond 25 units from spawn (0,0)
    e.update(0.016, makePlayer(30, 0));
    expect(e.stateLabel).toBe(STATE.RETURN);
  });

  it("stays CHASE when player is inside returnRange", () => {
    const e = makeEnemy();
    e.state = STATE.CHASE;

    // Player at (20, 0) — within returnRange=25, outside attackRange=1.8
    e.update(0.016, makePlayer(20, 0));
    // Still chasing (moves toward player)
    expect(e.stateLabel).toBe(STATE.CHASE);
  });
});
