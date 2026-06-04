/**
 * ResourceDefinitions — authored resource tables keyed by world biome.
 *
 * Each entry describes one harvestable resource type: which biomes it appears
 * in, what greybox mesh to use, how many hits to deplete, and what items drop.
 *
 * Pure data — no Three.js, no DOM. Fully Jest-testable.
 */

export const RESOURCE_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "wood",
    name: "Timber",
    biomes: Object.freeze(["hearthmere", "blackroot", "moonspire"]),
    meshColor: 0x5c4033,
    meshType: "box",
    hitPoints: 3,
    yield: Object.freeze({ itemId: "timber", count: 2 })
  }),
  Object.freeze({
    id: "ore",
    name: "Iron Ore",
    biomes: Object.freeze(["hearthmere", "ironvale", "gravehold"]),
    meshColor: 0x888888,
    meshType: "sphere",
    hitPoints: 5,
    yield: Object.freeze({ itemId: "iron_ore", count: 1 })
  }),
  Object.freeze({
    id: "herb",
    name: "Ashleaf",
    biomes: Object.freeze(["hearthmere", "ashen_wastes"]),
    meshColor: 0x6b8e4e,
    meshType: "cylinder",
    hitPoints: 1,
    yield: Object.freeze({ itemId: "ashleaf", count: 3 })
  }),
  Object.freeze({
    id: "crystal",
    name: "Mooncrystal",
    biomes: Object.freeze(["moonspire", "sunken_temple"]),
    meshColor: 0xaabbdd,
    meshType: "sphere",
    hitPoints: 4,
    yield: Object.freeze({ itemId: "mooncrystal", count: 1 })
  }),
  Object.freeze({
    id: "bone",
    name: "Bleached Bone",
    biomes: Object.freeze(["gravehold", "ashen_wastes", "dragon_coast"]),
    meshColor: 0xd4cbb8,
    meshType: "box",
    hitPoints: 2,
    yield: Object.freeze({ itemId: "bone", count: 2 })
  }),
  Object.freeze({
    id: "ember_coal",
    name: "Ember Coal",
    biomes: Object.freeze(["ironvale", "dragon_coast", "ashen_wastes"]),
    meshColor: 0x3a2828,
    meshType: "sphere",
    hitPoints: 3,
    yield: Object.freeze({ itemId: "ember_coal", count: 1 })
  }),
  Object.freeze({
    id: "root",
    name: "Blackroot",
    biomes: Object.freeze(["blackroot", "sunken_temple"]),
    meshColor: 0x2a3520,
    meshType: "cylinder",
    hitPoints: 2,
    yield: Object.freeze({ itemId: "blackroot", count: 2 })
  })
]);

/**
 * Return all resource definitions valid for the given biome.
 * Returns an empty array for unknown biome IDs.
 *
 * @param {string} biomeId
 * @returns {ReadonlyArray<object>}
 */
export function getResourcesForBiome(biomeId) {
  if (typeof biomeId !== "string" || biomeId.length === 0) return [];
  return RESOURCE_DEFINITIONS.filter((def) => def.biomes.includes(biomeId));
}
