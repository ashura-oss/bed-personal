import { WORLD_SEED_DEFAULT, HEARTHMERE_REGION_BOUNDS } from "../../gen/WorldConfig.js";
import { loadAuthoredHeightmap } from "../../authored/AuthoredHeightmap.js";

/**
 * Hearthmere macro heightmap — 17 columns x 13 rows.
 *
 * Grid mapping:
 *   Column 0  = X = -2500  |  Column 16 = X = +2500
 *   Row    0  = Z = -2000  |  Row    12 = Z = +2000
 *
 * Sub-area intent (elevation in world units):
 *   Centre (near origin)                 : Hearthmere Plains    — flat   0–3
 *   South corridor (Z +1000 to +2000)    : Ashfall Road         — ramp   3–8
 *   Northwest (X -1500→-2500, Z -500→-2000): Ember Ridge        — rocky 14–22
 *   East (X +1000→+2500, Z -500→+1000)  : Copperstone Mine     — hills   6–12
 *   Southeast interior (X+500→+2000, Z+500→+2000): Greymere Fen — sunken -1–2
 *   Eastern & SE boundary (X≈+2500)     : Eastern Highlands    — high ≥14
 *   Southwest (X -1500→-500, Z +200→+1500): Hollow's Reach     — slopes  4–10
 *   West (X -2500→-1000, Z -500→+500)   : Crypt Approach       — rocky   8–15
 *   North (Z -2000→-800)                 : Northern Reaches     — hills   5–9
 *
 * The far-east column (col 16 = X=+2500) stays elevated throughout to satisfy
 * the constraint: heightAt(2500, 2000) - heightAt(0, 0) > 10.
 */
export const HEARTHMERE_HEIGHTMAP_SAMPLES = Object.freeze([
  // Row 0  Z = -2000  (Northern Reaches — moderate hills; NW=Ember Ridge peaks)
  Object.freeze([18, 16, 14, 12, 9,  8,  7,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15]),
  // Row 1  Z = -1667
  Object.freeze([20, 17, 15, 11, 8,  7,  6,  5,  6,  7,  8,  9,  10, 11, 13, 15, 16]),
  // Row 2  Z = -1333
  Object.freeze([22, 19, 16, 12, 9,  7,  5,  4,  5,  6,  8,  9,  10, 11, 12, 14, 15]),
  // Row 3  Z = -1000  (Ember Ridge peaking NW; Copperstone rising East)
  Object.freeze([21, 18, 15, 11, 8,  6,  4,  3,  4,  6,  8,  9,  10, 11, 12, 13, 14]),
  // Row 4  Z = -667
  Object.freeze([17, 15, 12, 10, 8,  5,  3,  2,  3,  5,  7,  9,  10, 11, 12, 13, 14]),
  // Row 5  Z = -333   (Crypt Approach west; Plains centre; Copperstone east)
  Object.freeze([14, 12, 10, 9,  7,  4,  2,  1,  2,  4,  6,  8,  10, 11, 12, 13, 13]),
  // Row 6  Z =  0     (Plains centre; Crypt west; Copperstone east)
  Object.freeze([13, 11, 10, 9,  6,  3,  1,  0,  1,  3,  6,  8,  10, 11, 12, 13, 13]),
  // Row 7  Z = +333   (Plains fade; east hills; Hollow's Reach emerging SW)
  Object.freeze([12, 10, 9,  8,  6,  3,  1,  0,  1,  3,  5,  7,  9,  11, 12, 13, 13]),
  // Row 8  Z = +667   (Hollow's Reach SW slopes; Fen interior sinking)
  Object.freeze([10,  9, 7,  6,  5,  3,  1,  0,  1,  3,  3,  3,  5,  10, 12, 13, 14]),
  // Row 9  Z = +1000  (Hollow's SW; Ashfall centre ramp; Fen interior sunken; East highlands)
  Object.freeze([ 8,  7, 5,  4,  4,  4,  3,  3,  4,  5,  1, -1, -1,   6, 12, 14, 15]),
  // Row 10 Z = +1333
  Object.freeze([ 7,  6, 5,  5,  5,  5,  4,  4,  5,  6,  0, -1, -1,   5, 12, 14, 15]),
  // Row 11 Z = +1667  (Ashfall narrows; Fen deepest; Eastern highlands)
  Object.freeze([ 6,  5, 5,  6,  6,  6,  5,  5,  6,  7, -1, -1,  0,   7, 13, 15, 16]),
  // Row 12 Z = +2000  (South edge; Ashfall ramp end; Eastern highlands continue)
  Object.freeze([ 6,  5, 5,  6,  7,  7,  6,  6,  7,  8,  0,  1,  3,   8, 13, 15, 17])
]);

export const HEARTHMERE_HEIGHTMAP_DEFINITION = Object.freeze({
  id: "hearthmere.macro_heightmap.v1",
  bounds: HEARTHMERE_REGION_BOUNDS,
  samples: HEARTHMERE_HEIGHTMAP_SAMPLES,
  detail: Object.freeze({
    amplitude: 0.35,
    frequency: 0.018,
    octaves: 2,
    seed: WORLD_SEED_DEFAULT + 4043
  })
});

export function createHearthmereHeightmap(options = {}) {
  return loadAuthoredHeightmap({
    ...HEARTHMERE_HEIGHTMAP_DEFINITION,
    ...options,
    detail: {
      ...HEARTHMERE_HEIGHTMAP_DEFINITION.detail,
      ...(options.detail ?? {})
    }
  });
}
