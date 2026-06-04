import { describe, expect, it } from "@jest/globals";
import { clamp } from "../utils/clamp.js";

describe("clamp", () => {
  it("returns the value when it is inside the range", () => {
    expect(clamp(4, 0, 10)).toBe(4);
  });

  it("returns the lower bound when the value is too small", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("returns the upper bound when the value is too large", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("rejects inverted bounds", () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
  });
});
