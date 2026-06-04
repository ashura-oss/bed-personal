/**
 * WorldConfig — tuning constants for the procedural world.
 *
 * Centralised so chunk size, view distance, and terrain shape can be tuned
 * in one place. All distances are in world units (metres).
 */

/** Default world seed (one integer drives the entire world). */
export const WORLD_SEED_DEFAULT = 1337;

/** Edge length of one chunk in world units. */
export const CHUNK_SIZE = 32;

/** Grid subdivisions per chunk edge (CHUNK_SEGS+1 vertices per side). */
export const CHUNK_SEGS = 20;

/** Chunks loaded in each direction around the player (radius=3 → 7×7 grid). */
export const LOAD_RADIUS = 3;

/** Extra ring kept loaded before unloading (hysteresis — avoids load/unload thrash). */
export const UNLOAD_PAD = 1;

/** Max chunk meshes built per ChunkManager.update() call (frame budget). */
export const MAX_CHUNK_BUILDS_PER_TICK = 2;

/** Vertical scale of the terrain (peak-to-trough range ≈ this). */
export const TERRAIN_AMPLITUDE = 7;

/** Baseline terrain height offset. */
export const TERRAIN_BASE_HEIGHT = 0;

/** Low-frequency noise scale (rolling hills). Smaller = broader features. */
export const TERRAIN_BASE_FREQ = 0.012;

/** High-frequency detail noise scale. */
export const TERRAIN_DETAIL_FREQ = 0.05;

/** Weight of the detail layer relative to the base. */
export const TERRAIN_DETAIL_WEIGHT = 0.28;
