/**
 * Hearthmere authored placements — WM-05 / WM-07
 *
 * Compact grid helper keeps clusters readable without repetition.
 * Each entry: { id, type, tags, origin:{x,y,z} }
 */

/**
 * Generates a rectangular grid of placement entries.
 *
 * @param {string} prefix - ID prefix (each entry appended with its index)
 * @param {string} type - placement type string
 * @param {string} tag - single tag string (wrapped in array)
 * @param {number} cx - world X of grid top-left corner
 * @param {number} cz - world Z of grid top-left corner
 * @param {number} cols - number of columns
 * @param {number} rows - number of rows
 * @param {number} spacing - world-unit spacing between entries
 * @returns {Array<object>}
 */
function grid(prefix, type, tag, cx, cz, cols, rows, spacing) {
  const entries = [];
  let index = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      entries.push(
        Object.freeze({
          id: `${prefix}${index}`,
          type,
          tags: Object.freeze([tag]),
          origin: Object.freeze({ x: cx + col * spacing, y: 0, z: cz + row * spacing })
        })
      );
      index += 1;
    }
  }

  return entries;
}

// ── Landmarks (4) ────────────────────────────────────────────────────────────

const LANDMARKS = Object.freeze([
  Object.freeze({
    id: "hearthmere.player_spawn",
    type: "spawn",
    tags: Object.freeze(["player", "spawn"]),
    origin: Object.freeze({ x: 0, y: 0, z: 3 })
  }),
  Object.freeze({
    id: "hearthmere.campfire",
    type: "landmark",
    tags: Object.freeze(["camp", "fire"]),
    origin: Object.freeze({ x: 12, y: 0, z: 18 })
  }),
  Object.freeze({
    id: "hearthmere.watchtower",
    type: "landmark",
    tags: Object.freeze(["watchtower"]),
    origin: Object.freeze({ x: 640, y: 0, z: -320 })
  }),
  Object.freeze({
    id: "hearthmere.south_gate",
    type: "landmark",
    tags: Object.freeze(["gate"]),
    origin: Object.freeze({ x: 0, y: 0, z: 1600 })
  })
]);

// ── Resources — Timber (38) ───────────────────────────────────────────────────
// Cluster A: 5×4 = 20 nodes, northern forest belt
// Cluster B: 3×3 =  9 nodes, Hollow's Reach
// Cluster C: 4×2 =  8 nodes, plains north edge  (WM-07)
// Extra: 1 node, south-east fringe

const TIMBER_A = grid("hearthmere.res.timber_a.", "resource", "timber", -300, -200, 5, 4, 60);
const TIMBER_B = grid("hearthmere.res.timber_b.", "resource", "timber", -800, 800, 3, 3, 70);
const TIMBER_C = grid("hearthmere.res.timber_c.", "resource", "timber", 400, -600, 4, 2, 65);
const TIMBER_EXTRA = [
  Object.freeze({
    id: "hearthmere.res.timber_extra.0",
    type: "resource",
    tags: Object.freeze(["timber"]),
    origin: Object.freeze({ x: 500, y: 0, z: 100 })
  })
];

// ── Resources — Iron Ore (31) ─────────────────────────────────────────────────
// Cluster A: 4×3 = 12 nodes, Copperstone ridge
// Cluster B: 3×3 =  9 nodes, Ember Ridge
// Cluster C: 2×2 =  4 nodes, plains seam
// Cluster D: 3×2 =  6 nodes, ridge eastern slope  (WM-07)

const ORE_A = grid("hearthmere.res.ore_a.", "resource", "iron_ore", 1400, 0, 4, 3, 80);
const ORE_B = grid("hearthmere.res.ore_b.", "resource", "iron_ore", -1800, -1000, 3, 3, 100);
const ORE_C = grid("hearthmere.res.ore_c.", "resource", "iron_ore", -200, -400, 2, 2, 90);
const ORE_D = grid("hearthmere.res.ore_d.", "resource", "iron_ore", -1200, -800, 3, 2, 110);

// ── Resources — Ashleaf Herb (31) ─────────────────────────────────────────────
// Cluster A: 4×4 = 16 nodes, Greymere Fen
// Cluster B: 2×3 =  6 nodes, Ashfall Road verge
// Cluster C: 3×1 =  3 nodes, plains scatter
// Cluster D: 3×2 =  6 nodes, fen approach  (WM-07)

const HERB_A = grid("hearthmere.res.herb_a.", "resource", "ashleaf", 1200, 1400, 4, 4, 65);
const HERB_B = grid("hearthmere.res.herb_b.", "resource", "ashleaf", 0, 1400, 2, 3, 80);
const HERB_C = grid("hearthmere.res.herb_c.", "resource", "ashleaf", 300, 500, 3, 1, 55);
const HERB_D = grid("hearthmere.res.herb_d.", "resource", "ashleaf", 800, 1200, 3, 2, 70);

// ── Enemy spawns (37) ─────────────────────────────────────────────────────────
// Hollow Shamblers — Plains:        4×2 =  8
// Hollow Shamblers — Hollow's Reach: 3×2 =  6
// Hollow Shamblers — Crypt approach: 3×2 =  6  (WM-07)
// Briar Wolves — Ashfall Road:       5×1 =  5
// Briar Wolves — Ember Ridge base:   3×2 =  6
// Briar Wolves — Greymere Fen:       3×2 =  6  (WM-07)

const ENEMY_SHAMBLER_PLAINS = grid(
  "hearthmere.enemy.shambler_plains.", "enemy", "hollow_shambler", 0, 0, 4, 2, 200
);
const ENEMY_SHAMBLER_HOLLOW = grid(
  "hearthmere.enemy.shambler_hollow.", "enemy", "hollow_shambler", -700, 900, 3, 2, 180
);
const ENEMY_SHAMBLER_CRYPT = grid(
  "hearthmere.enemy.shambler_crypt.", "enemy", "hollow_shambler", -1600, 300, 3, 2, 160
);
const ENEMY_WOLF_ROAD = grid(
  "hearthmere.enemy.wolf_road.", "enemy", "briar_wolf", 0, 1300, 5, 1, 160
);
const ENEMY_WOLF_RIDGE = grid(
  "hearthmere.enemy.wolf_ridge.", "enemy", "briar_wolf", -1200, -600, 3, 2, 180
);
const ENEMY_WOLF_FEN = grid(
  "hearthmere.enemy.wolf_fen.", "enemy", "briar_wolf", 900, 1300, 3, 2, 150
);

// ── Prefabs (5) ───────────────────────────────────────────────────────────────

const PREFABS = Object.freeze([
  Object.freeze({
    id: "hearthmere.prefab.camp",
    type: "prefab",
    tags: Object.freeze(["hearthmere_camp"]),
    origin: Object.freeze({ x: 42, y: 0, z: 28 })
  }),
  Object.freeze({
    id: "hearthmere.prefab.ashfall_gate",
    type: "prefab",
    tags: Object.freeze(["ashfall_road_gate"]),
    origin: Object.freeze({ x: 0, y: 0, z: 1600 })
  }),
  Object.freeze({
    id: "hearthmere.prefab.mine",
    type: "prefab",
    tags: Object.freeze(["copperstone_mine"]),
    origin: Object.freeze({ x: 1600, y: 0, z: 200 })
  }),
  Object.freeze({
    id: "hearthmere.prefab.hollow",
    type: "prefab",
    tags: Object.freeze(["hollow_reach_ruins"]),
    origin: Object.freeze({ x: -1000, y: 0, z: 900 })
  }),
  Object.freeze({
    id: "hearthmere.prefab.crypt",
    type: "prefab",
    tags: Object.freeze(["hearthmere_crypt"]),
    origin: Object.freeze({ x: -1600, y: 0, z: 300 })
  })
]);

// -- NPC spawn points (15) - authored Hearthmere cast (WM-07) -----------------

const NPC_NAMED = Object.freeze([
  Object.freeze({
    id: "hearthmere.npc.tessa_forge",
    type: "npc",
    tags: Object.freeze(["tessa", "blacksmith"]),
    origin: Object.freeze({ x: 18, y: 0, z: 24 })
  }),
  Object.freeze({
    id: "hearthmere.npc.aldric_guard",
    type: "npc",
    tags: Object.freeze(["aldric", "guard"]),
    origin: Object.freeze({ x: 8, y: 0, z: 35 })
  }),
  Object.freeze({
    id: "hearthmere.npc.marn_trader",
    type: "npc",
    tags: Object.freeze(["marn", "trader"]),
    origin: Object.freeze({ x: -5, y: 0, z: 22 })
  }),
  Object.freeze({
    id: "hearthmere.npc.unbound_wanderer",
    type: "npc",
    tags: Object.freeze(["wanderer", "unbound"]),
    origin: Object.freeze({ x: 60, y: 0, z: 10 })
  }),
  Object.freeze({
    id: "hearthmere.npc.road_scout",
    type: "npc",
    tags: Object.freeze(["scout"]),
    origin: Object.freeze({ x: 0, y: 0, z: 1200 })
  }),
  Object.freeze({
    id: "hearthmere.npc.hollow_survivor",
    type: "npc",
    tags: Object.freeze(["survivor", "hollow"]),
    origin: Object.freeze({ x: -800, y: 0, z: 700 })
  }),
  Object.freeze({
    id: "hearthmere.npc.mine_foreman",
    type: "npc",
    tags: Object.freeze(["foreman", "miner"]),
    origin: Object.freeze({ x: 1500, y: 0, z: 180 })
  })
]);

// 4×2 = 8 scattered travellers in the plains
const NPC_TRAVELLERS = grid(
  "hearthmere.npc.traveller.", "npc", "traveller", 200, 400, 4, 2, 180
);

// ── Boss arena (W-08) ─────────────────────────────────────────────────────────
// The Hollowbound Caravan Guard guards the Hearthmere Crypt.
// Player approaches from the east/north (positive-Z side), so the gate is placed
// at z=336 (north of the crypt entrance at z=300) and the boss spawns just inside
// at z=312.

export const HEARTHMERE_BOSS_ARENA = Object.freeze({
  id: "hearthmere.boss.hollowbound_guard",
  encounterId: "hearthmere.encounter.hollowbound_guard",
  prefabId: "hearthmere_crypt",
  placementId: "hearthmere.prefab.crypt",
  bossName: "Hollowbound Caravan Guard",
  centerOffset: Object.freeze({ x: 0, z: 12 }),
  gateOffset: Object.freeze({ x: 0, z: 36 }),
  center: Object.freeze({ x: -1600, z: 312 }),
  gatePosition: Object.freeze({ x: -1600, z: 336 }),
  armRadius: 45,
  sealRadius: 18,
});

// ── Assemble and export ───────────────────────────────────────────────────────

export const HEARTHMERE_PLACEMENTS = Object.freeze([
  ...LANDMARKS,
  ...TIMBER_A,
  ...TIMBER_B,
  ...TIMBER_C,
  ...TIMBER_EXTRA,
  ...ORE_A,
  ...ORE_B,
  ...ORE_C,
  ...ORE_D,
  ...HERB_A,
  ...HERB_B,
  ...HERB_C,
  ...HERB_D,
  ...ENEMY_SHAMBLER_PLAINS,
  ...ENEMY_SHAMBLER_HOLLOW,
  ...ENEMY_SHAMBLER_CRYPT,
  ...ENEMY_WOLF_ROAD,
  ...ENEMY_WOLF_RIDGE,
  ...ENEMY_WOLF_FEN,
  ...PREFABS,
  ...NPC_NAMED,
  ...NPC_TRAVELLERS
]);
