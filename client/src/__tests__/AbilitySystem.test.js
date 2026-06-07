import { describe, expect, it, jest } from "@jest/globals";
import { getAbilityDefinition } from "../gameplay/player/AbilityDefinitions.js";
import { AbilitySystem } from "../gameplay/player/AbilitySystem.js";

function makeFp(value = 100) {
  return {
    value,
    canSpend(amount) {
      return this.value >= amount;
    },
    spend(amount) {
      if (!this.canSpend(amount)) return false;
      this.value -= amount;
      return true;
    }
  };
}

function makeTarget({ x = 0, y = 0, z = 0 } = {}) {
  return {
    position: { x, y, z },
    hp: 100,
    takeDamage: jest.fn(function takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      this.isDead = this.hp <= 0;
    })
  };
}

describe("AbilitySystem", () => {
  it("unlocks and equips known abilities into Q/E/R slots", () => {
    const system = new AbilitySystem();

    expect(system.equipAbility("Q", "ability_spark")).toMatchObject({
      ok: false,
      reason: "locked"
    });

    system.unlockAbility("ability_spark");
    expect(system.equipAbility("q", "ability_spark")).toMatchObject({
      ok: true,
      slot: "Q",
      ability: expect.objectContaining({ abilityId: "ability_spark" })
    });

    expect(system.getEquippedSlots()).toEqual({ Q: "ability_spark", E: null, R: null });
    expect(system.getHotbarViewModel()[0]).toMatchObject({
      slot: "Q",
      keyGlyph: "Q",
      abilityId: "ability_spark",
      isEmpty: false,
      isUnlocked: true
    });
  });

  it("blocks use while cooldown remains and allows use after ticking down", () => {
    const fp = makeFp(100);
    const target = makeTarget({ z: 4 });
    const system = new AbilitySystem({
      fp,
      unlockedAbilityIds: ["ability_spark"],
      equippedSlots: { Q: "ability_spark" }
    });

    const firstUse = system.useSlot("Q", {
      origin: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: 1 },
      targets: [target]
    });
    expect(firstUse).toMatchObject({ ok: true, cooldownRemaining: 2.4 });

    expect(system.canUseSlot("Q")).toMatchObject({
      ok: false,
      reason: "cooldown",
      cooldownRemaining: expect.any(Number)
    });

    system.update(getAbilityDefinition("ability_spark").cooldown);
    expect(system.canUseSlot("Q")).toMatchObject({ ok: true });
  });

  it("gates activation when FP is insufficient without damaging or starting cooldown", () => {
    const fp = makeFp(7);
    const target = makeTarget({ z: 3 });
    const system = new AbilitySystem({
      fp,
      unlockedAbilityIds: ["ability_spark"],
      equippedSlots: { Q: "ability_spark" }
    });

    const result = system.useSlot("Q", {
      origin: { x: 0, y: 0, z: 0 },
      targets: [target]
    });

    expect(result).toMatchObject({ ok: false, reason: "fp", fpCost: 8, fpAvailable: 7 });
    expect(target.takeDamage).not.toHaveBeenCalled();
    expect(system.getCooldownRemaining("ability_spark")).toBe(0);
    expect(fp.value).toBe(7);
  });

  it("selects the nearest valid target in range and applies damage through takeDamage", () => {
    const fp = makeFp(100);
    const farTarget = makeTarget({ z: 8 });
    const nearTarget = makeTarget({ z: 3 });
    const system = new AbilitySystem({
      fp,
      unlockedAbilityIds: ["ability_spark"],
      equippedSlots: { Q: "ability_spark" }
    });

    const result = system.useSlot("Q", {
      origin: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: 1 },
      targets: [farTarget, nearTarget]
    });

    expect(result).toMatchObject({
      ok: true,
      target: nearTarget,
      application: {
        damage: 16,
        method: "takeDamage"
      }
    });
    expect(nearTarget.takeDamage).toHaveBeenCalledWith(16);
    expect(nearTarget.hp).toBe(84);
    expect(farTarget.takeDamage).not.toHaveBeenCalled();
    expect(fp.value).toBe(92);
  });

  it("applies damage through hit when a target exposes combat hit results", () => {
    const fp = makeFp(100);
    const target = {
      position: { x: 0, y: 0, z: 2 },
      alive: true,
      hit: jest.fn(() => ({ damage: 28, died: false, embersRewarded: 0 }))
    };
    const system = new AbilitySystem({
      fp,
      unlockedAbilityIds: ["ability_flame_slash"],
      equippedSlots: { E: "ability_flame_slash" }
    });

    const result = system.useSlot("E", {
      origin: { x: 0, y: 0, z: 0 },
      targets: [target]
    });

    expect(target.hit).toHaveBeenCalledWith(28);
    expect(result.application).toMatchObject({
      damage: 28,
      died: false,
      embersRewarded: 0,
      method: "hit"
    });
  });

  it("serializes and restores unlocked ids, equipped slots, and cooldown remaining", () => {
    const system = new AbilitySystem({
      fp: makeFp(100),
      unlockedAbilityIds: ["ability_spark", "ability_thornbind"],
      equippedSlots: { Q: "ability_spark", R: "ability_thornbind" }
    });
    system.useSlot("Q", {
      origin: { x: 0, y: 0, z: 0 },
      targets: [makeTarget({ z: 2 })]
    });
    system.update(1);

    const state = system.serializeLoadout();
    expect(state).toEqual({
      unlockedAbilityIds: ["ability_spark", "ability_thornbind"],
      equippedSlots: { Q: "ability_spark", E: null, R: "ability_thornbind" },
      cooldowns: [{ abilityId: "ability_spark", remaining: 1.4 }]
    });

    const restored = new AbilitySystem({ fp: makeFp(100) });
    restored.loadLoadout(state);

    expect(restored.getEquippedSlots()).toEqual(state.equippedSlots);
    expect(restored.getUnlockedAbilityIds()).toEqual(state.unlockedAbilityIds);
    expect(restored.getCooldownRemaining("ability_spark")).toBeCloseTo(1.4);
    expect(restored.getAbilityMenuViewModel().find((item) => item.abilityId === "ability_spark")).toMatchObject({
      isUnlocked: true,
      isEquipped: true,
      slot: "Q",
      cooldownRemaining: expect.any(Number)
    });
  });
});
