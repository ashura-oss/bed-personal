import { describe, expect, it } from "@jest/globals";
import { applyPrefabHeightBlend, prefabInfluenceAt, samplePrefabInfluence } from "../world/prefab/PrefabFootprint.js";

describe("PrefabFootprint", () => {
  const prefab = Object.freeze({
    id: "test_prefab",
    origin: Object.freeze({ x: 10, y: 4, z: 20 }),
    padHeight: 4,
    footprintRadius: 10,
    blendRadius: 4
  });

  it("fully flattens the inner pad", () => {
    expect(prefabInfluenceAt(10, 20, prefab)).toBe(1);
    expect(applyPrefabHeightBlend(11, 10, 20, [prefab])).toBe(4);
  });

  it("does not alter terrain outside the footprint", () => {
    expect(prefabInfluenceAt(22, 20, prefab)).toBe(0);
    expect(applyPrefabHeightBlend(11, 22, 20, [prefab])).toBe(11);
  });

  it("smoothly blends through the footprint edge", () => {
    const nearInner = applyPrefabHeightBlend(12, 16.1, 20, [prefab]);
    const nearOuter = applyPrefabHeightBlend(12, 19.9, 20, [prefab]);

    expect(nearInner).toBeLessThan(nearOuter);
    expect(nearInner).toBeGreaterThanOrEqual(prefab.padHeight);
    expect(nearOuter).toBeLessThanOrEqual(12);
  });

  it("chooses the strongest overlapping footprint deterministically", () => {
    const second = Object.freeze({
      ...prefab,
      id: "second_prefab",
      origin: Object.freeze({ x: 12, y: 3, z: 20 }),
      padHeight: 3
    });
    const sample = samplePrefabInfluence(18, 20, [prefab, second]);

    expect(sample.prefab.id).toBe("second_prefab");
    expect(sample.influence).toBe(1);
  });
});
