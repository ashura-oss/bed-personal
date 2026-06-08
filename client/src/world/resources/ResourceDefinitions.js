/**
 * ResourceDefinitions — authored resource tables keyed by world biome.
 *
 * Each entry describes one harvestable resource type: which biomes it appears
 * in, which generated visual profile to use, how many hits to deplete, and
 * what items drop.
 *
 * Pure data — no Three.js, no DOM. Fully Jest-testable. The legacy mesh
 * fields remain as compact art-profile hints for generated visuals and tests.
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

function normalizeResourceKey(resourceKey) {
  return typeof resourceKey === "string" ? resourceKey.trim() : "";
}

const RESOURCE_DEFINITION_TAG_MAP = new Map(
  RESOURCE_DEFINITIONS.flatMap((definition) => [
    [definition.id, definition],
    [definition.yield.itemId, definition]
  ])
);

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

/**
 * Resolve a resource definition from authored placement tags.
 * Supports both resource-definition ids ("wood") and yielded item ids
 * used by authored placements ("timber").
 *
 * @param {readonly string[]} tags
 * @returns {object | null}
 */
export function getResourceDefinitionForPlacementTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  for (const tag of tags) {
    const normalizedTag = normalizeResourceKey(tag);
    if (!normalizedTag) continue;

    const definition = RESOURCE_DEFINITION_TAG_MAP.get(normalizedTag);
    if (definition) return definition;
  }

  return null;
}
