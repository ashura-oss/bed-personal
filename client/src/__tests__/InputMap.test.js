import { describe, expect, it } from "@jest/globals";
import { Action, actionForKeyCode, axesToDirection } from "../controls/InputMap.js";

// InputMap itself requires a DOM environment; we test only the pure helper.

describe("axesToDirection", () => {
  it("returns zero vector when no input", () => {
    const direction = axesToDirection(0, 0);
    expect(direction.x).toBe(0);
    expect(direction.z).toBe(0);
  });

  it("forward input maps to negative Z (into screen)", () => {
    const direction = axesToDirection(1, 0);
    expect(direction.x).toBe(0);
    expect(direction.z).toBe(-1);
  });

  it("back input maps to positive Z", () => {
    const direction = axesToDirection(-1, 0);
    expect(direction.x).toBe(0);
    expect(direction.z).toBe(1);
  });

  it("right input maps to positive X", () => {
    const direction = axesToDirection(0, 1);
    expect(direction.x).toBe(1);
    expect(direction.z).toBe(0);
  });

  it("left input maps to negative X", () => {
    const direction = axesToDirection(0, -1);
    expect(direction.x).toBe(-1);
    expect(direction.z).toBe(0);
  });

  it("diagonal input is normalised (length ≈ 1)", () => {
    const direction = axesToDirection(1, 1);
    const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    expect(length).toBeCloseTo(1, 5);
  });

  it("all-zero axes produce zero vector (no NaN)", () => {
    const direction = axesToDirection(0, 0);
    expect(Number.isNaN(direction.x)).toBe(false);
    expect(Number.isNaN(direction.z)).toBe(false);
  });
});

describe("actionForKeyCode", () => {
  it("maps KeyI to the inventory action", () => {
    expect(actionForKeyCode("KeyI")).toBe(Action.Inventory);
  });

  it("maps KeyL to the quest log action without moving LightAttack off KeyJ", () => {
    expect(actionForKeyCode("KeyL")).toBe(Action.QuestLog);
    expect(actionForKeyCode("KeyJ")).toBe(Action.LightAttack);
  });

  it("returns null for unmapped keys", () => {
    expect(actionForKeyCode("KeyP")).toBeNull();
  });
});
