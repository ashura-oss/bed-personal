import { describe, expect, it } from "@jest/globals";
import { StaminaSystem } from "../gameplay/player/StaminaSystem.js";

describe("StaminaSystem construction", () => {
  it("starts full", () => {
    const stamina = new StaminaSystem({ max: 100 });
    expect(stamina.value).toBe(100);
    expect(stamina.ratio).toBe(1);
    expect(stamina.isEmpty).toBe(false);
  });

  it("defaults to max 100", () => {
    expect(new StaminaSystem().max).toBe(100);
  });
});

describe("StaminaSystem.spend", () => {
  it("deducts the amount", () => {
    const stamina = new StaminaSystem({ max: 100 });
    const ok = stamina.spend(25);
    expect(ok).toBe(true);
    expect(stamina.value).toBe(75);
  });

  it("returns false when insufficient and does not deduct", () => {
    const stamina = new StaminaSystem({ max: 100 });
    stamina.spend(80);
    const ok = stamina.spend(25);
    expect(ok).toBe(false);
    expect(stamina.value).toBe(20);
  });

  it("does not go below 0", () => {
    const stamina = new StaminaSystem({ max: 50 });
    stamina.spend(50);
    expect(stamina.value).toBe(0);
    expect(stamina.isEmpty).toBe(true);
  });

  it("canSpend returns false when empty", () => {
    const stamina = new StaminaSystem({ max: 30 });
    stamina.spend(30);
    expect(stamina.canSpend(1)).toBe(false);
  });
});

describe("StaminaSystem.update — regen delay", () => {
  it("does not regen during the delay window", () => {
    const stamina = new StaminaSystem({
      max: 100,
      regenRate: 30,
      regenDelay: 1.0
    });

    stamina.spend(50);
    const changed = stamina.update(0.5);
    expect(changed).toBe(false);
    expect(stamina.value).toBe(50);
  });

  it("regens after the delay expires", () => {
    const stamina = new StaminaSystem({
      max: 100,
      regenRate: 30,
      regenDelay: 1.0
    });

    stamina.spend(30);
    stamina.update(1.0);
    const changed = stamina.update(1.0);
    expect(changed).toBe(true);
    expect(stamina.value).toBeCloseTo(100, 0);
  });

  it("does not exceed max on regen", () => {
    const stamina = new StaminaSystem({
      max: 100,
      regenRate: 100,
      regenDelay: 0
    });

    stamina.spend(10);
    stamina.update(2);
    expect(stamina.value).toBe(100);
  });
});

describe("StaminaSystem.update return value", () => {
  it("returns true when value changed", () => {
    const stamina = new StaminaSystem({
      max: 100,
      regenRate: 30,
      regenDelay: 0
    });

    stamina.spend(10);
    const changed = stamina.update(0.5);
    expect(changed).toBe(true);
  });

  it("returns false when already full", () => {
    const stamina = new StaminaSystem({ max: 100 });
    const changed = stamina.update(1);
    expect(changed).toBe(false);
  });
});

describe("StaminaSystem.restoreAll", () => {
  it("restores to max and resets regen timer", () => {
    const stamina = new StaminaSystem({
      max: 100,
      regenRate: 5,
      regenDelay: 2
    });

    stamina.spend(60);
    stamina.restoreAll();
    expect(stamina.value).toBe(100);
    const changed = stamina.update(0.1);
    expect(changed).toBe(false);
  });
});
