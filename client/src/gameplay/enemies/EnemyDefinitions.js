/**
 * EnemyDefinitions — authored enemy type catalogue keyed by world biome.
 *
 * Pure data — no Three.js, no DOM. Fully Jest-testable.
 *
 * Each entry describes one wandering enemy type: which biomes it appears in,
 * its stats, speed tiers, loot table, and how many may spawn per chunk.
 */

export const ENEMY_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'hollow_shambler',
    name: 'Hollow Shambler',
    hp: 30,
    damage: 8,
    aggroRange: 10,
    attackRange: 1.8,
    speed: Object.freeze({ wander: 2, chase: 4.5 }),
    lootTable: Object.freeze([
      Object.freeze({ itemId: 'ember_shard', count: 1, chance: 0.8 }),
      Object.freeze({ itemId: 'iron_ore',    count: 1, chance: 0.4 }),
    ]),
    biomes: Object.freeze(['hearthmere', 'gravehold', 'ashen_wastes']),
    maxPerChunk: 3,
  }),
  Object.freeze({
    id: 'briar_wolf',
    name: 'Briar Wolf',
    hp: 20,
    damage: 5,
    aggroRange: 14,
    attackRange: 1.5,
    speed: Object.freeze({ wander: 3, chase: 6 }),
    lootTable: Object.freeze([
      Object.freeze({ itemId: 'timber', count: 1, chance: 0.6 }),
    ]),
    biomes: Object.freeze(['hearthmere', 'blackroot', 'moonspire']),
    maxPerChunk: 4,
  }),
]);

function normalizeEnemyId(enemyId) {
  return typeof enemyId === 'string' ? enemyId.trim() : '';
}

const ENEMY_DEFINITION_MAP = new Map(
  ENEMY_DEFINITIONS.map((definition) => [definition.id, definition])
);

/**
 * Return all enemy definitions valid for the given biome.
 * Returns an empty array for unknown biome IDs.
 *
 * @param {string} biomeId
 * @returns {ReadonlyArray<object>}
 */
export function getEnemiesForBiome(biomeId) {
  if (typeof biomeId !== 'string' || biomeId.length === 0) return [];
  return ENEMY_DEFINITIONS.filter((def) => def.biomes.includes(biomeId));
}

/**
 * Resolve one enemy definition by id.
 *
 * @param {string} enemyId
 * @returns {object | null}
 */
export function getEnemyDefinition(enemyId) {
  const normalizedId = normalizeEnemyId(enemyId);
  return normalizedId ? ENEMY_DEFINITION_MAP.get(normalizedId) ?? null : null;
}

/**
 * Resolve an enemy definition from authored placement tags.
 *
 * @param {readonly string[]} tags
 * @returns {object | null}
 */
export function getEnemyDefinitionForPlacementTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  for (const tag of tags) {
    const definition = getEnemyDefinition(tag);
    if (definition) return definition;
  }

  return null;
}
