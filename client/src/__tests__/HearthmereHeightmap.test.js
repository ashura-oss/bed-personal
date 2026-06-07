import { describe, expect, it } from "@jest/globals";
import {
  HEARTHMERE_HEIGHTMAP_DEFINITION,
  HEARTHMERE_HEIGHTMAP_SAMPLES,
  createHearthmereHeightmap
} from "../world/regions/hearthmere/heightmap.js";

describe("HearthmereHeightmap — authored 17x13 grid", () => {
  const heightmap = createHearthmereHeightmap();

  it("grid has 13 rows of 17 columns each", () => {
    expect(HEARTHMERE_HEIGHTMAP_SAMPLES).toHaveLength(13);
    for (const row of HEARTHMERE_HEIGHTMAP_SAMPLES) {
      expect(row).toHaveLength(17);
    }
  });

  it("all 17x13 grid samples are finite numbers", () => {
    for (const row of HEARTHMERE_HEIGHTMAP_SAMPLES) {
      for (const value of row) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it("origin (0, 0) is low terrain — Hearthmere Plains centre (≤ 5 units)", () => {
    // Grid centre col=8, row=6 maps X=0, Z=0; value is 0
    const h = heightmap.heightAt(0, 0);
    expect(Number.isFinite(h)).toBe(true);
    // detail noise amplitude is 0.35 so max deviation from macro is ±0.35
    expect(h).toBeLessThanOrEqual(5);
  });

  it("northwest (-2000, -1500) is high terrain — Ember Ridge (≥ 12 units)", () => {
    // Grid col≈1.6, row≈1.5 — macro values 17–20 in that region
    const h = heightmap.heightAt(-2000, -1500);
    expect(Number.isFinite(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(12);
  });

  it("south-centre (0, 1600) is moderate — Ashfall Road ramp (3–10 units)", () => {
    // Grid col=8, row≈10.8 — macro values around 4–6
    const h = heightmap.heightAt(0, 1600);
    expect(Number.isFinite(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(3);
    expect(h).toBeLessThanOrEqual(10);
  });

  it("southeast (1500, 1500) is low/flat — Greymere Fen (≤ 6 units)", () => {
    // Grid col≈12.8, row≈10.5 — fen interior macro values around -1 to 5
    // (the far-eastern boundary column stays elevated but the fen interior is low)
    const h = heightmap.heightAt(1500, 1500);
    expect(Number.isFinite(h)).toBe(true);
    expect(h).toBeLessThanOrEqual(6);
  });

  it("bilinear continuity — adjacent samples differ by < 0.5 units", () => {
    // A tiny step in X should not produce a large height jump
    const h1 = heightmap.heightAt(100, 0);
    const h2 = heightmap.heightAt(100.1, 0);
    expect(Math.abs(h1 - h2)).toBeLessThan(0.5);
  });

  it("returns null outside Hearthmere bounds", () => {
    expect(heightmap.heightAt(-2600, 0)).toBeNull();
    expect(heightmap.heightAt(0, 2100)).toBeNull();
    expect(heightmap.heightAt(2501, 0)).toBeNull();
    expect(heightmap.heightAt(0, -2001)).toBeNull();
  });

  it("same coordinates always produce the same height (determinism)", () => {
    const h1 = heightmap.heightAt(312.5, -750);
    const h2 = heightmap.heightAt(312.5, -750);
    expect(h1).toBe(h2);
  });

  it("heightmap id and bounds match the definition constants", () => {
    expect(heightmap.id).toBe(HEARTHMERE_HEIGHTMAP_DEFINITION.id);
    expect(heightmap.bounds).toEqual(HEARTHMERE_HEIGHTMAP_DEFINITION.bounds);
  });

  it("terrain is not flat — ridge is significantly higher than the plains", () => {
    const plainsH = heightmap.heightAt(0, 0);
    const ridgeH = heightmap.heightAt(-2000, -1500);
    expect(ridgeH - plainsH).toBeGreaterThan(10);
  });
});
