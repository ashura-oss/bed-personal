/**
 * Rng — deterministic seeded randomness + value noise for world generation.
 *
 * Pure, no DOM, no Three.js. Fully Jest-testable.
 *
 * The whole world is derived from a single integer seed. The same
 * (seed, x, z) always produces the same value — no `Math.random()` anywhere —
 * so worlds are reproducible and chunk edges line up exactly.
 *
 * Noise is sampled in WORLD space, so neighbouring chunks compute identical
 * heights at their shared boundary vertices (no seams, no fall-through).
 */

// Scalar helpers

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Smootherstep (Ken Perlin's quintic) — C2 continuous, no grid creases. */
export function smootherstep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Seeded PRNG

/**
 * mulberry32 — a fast, well-distributed 32-bit seeded PRNG.
 * Returns a function producing floats in [0, 1).
 */
export function mulberry32(seed) {
  let state = seed | 0;

  return function next() {
    state = state + 0x6d2b79f5 | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Integer lattice hash

/**
 * Hash two integer lattice coordinates + seed into a float in [0, 1).
 * Deterministic and stateless — the basis for value noise.
 */
export function hash2(ix, iz, seed) {
  let h = seed ^ Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Value noise

/**
 * 2D value noise in [0, 1]. Bilinear interpolation of lattice hashes with a
 * smootherstep fade. Continuous everywhere — adjacent samples vary smoothly.
 */
export function valueNoise2D(x, z, seed) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const xf = x - x0;
  const zf = z - z0;
  const v00 = hash2(x0, z0, seed);
  const v10 = hash2(x0 + 1, z0, seed);
  const v01 = hash2(x0, z0 + 1, seed);
  const v11 = hash2(x0 + 1, z0 + 1, seed);
  const u = smootherstep(xf);
  const w = smootherstep(zf);
  const a = lerp(v00, v10, u);
  const b = lerp(v01, v11, u);
  return lerp(a, b, w);
}

// Fractal Brownian motion

/**
 * Fractal Brownian motion — sums octaves of value noise.
 * Returns a value normalised to [0, 1].
 *
 * Each octave uses a salted seed so layers are decorrelated.
 */
export function fbm(x, z, seed, options = {}) {
  const octaves = options.octaves ?? 4;
  const lacunarity = options.lacunarity ?? 2;
  const gain = options.gain ?? 0.5;
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let norm = 0;

  for (let octave = 0; octave < octaves; octave += 1) {
    sum += amplitude * valueNoise2D(x * frequency, z * frequency, seed + octave * 1013);
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return norm > 0 ? sum / norm : 0;
}
