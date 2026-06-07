/**
 * LootResolver — pure loot-roll helper.
 *
 * Zero imports. No side effects. No Three.js, no UIBus, no Math.random().
 * All randomness is injected via the `rng` parameter so results are fully
 * deterministic and testable.
 */

/**
 * Roll a lootTable and return the items whose chance check passed.
 *
 * Each entry is evaluated independently:
 *   rng() < entry.chance  →  grant { itemId, count }
 *
 * @param {Array<{ itemId: string, count: number, chance: number }>} lootTable
 * @param {Function} rng  — seeded PRNG returning floats in [0, 1)
 * @returns {Array<{ itemId: string, count: number }>}
 */
export function rollLoot(lootTable, rng) {
  if (!Array.isArray(lootTable) || lootTable.length === 0) return [];

  const granted = [];

  for (const entry of lootTable) {
    if (rng() < entry.chance) {
      granted.push({ itemId: entry.itemId, count: entry.count });
    }
  }

  return granted;
}
