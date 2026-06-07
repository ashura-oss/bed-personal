import { describe, test, expect } from '@jest/globals';
import { rollLoot } from '../gameplay/enemies/LootResolver.js';

// ── helpers ────────────────────────────────────────────────────────────────────

/** rng that always returns the given constant value */
const constant = (value) => () => value;

/** rng that returns values from a sequence, cycling if exhausted */
const sequence = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

// ── test suite ─────────────────────────────────────────────────────────────────

describe('rollLoot', () => {
  // 1. All rolls pass — chance 1.0, rng returns 0 (0 < 1.0 → true)
  test('grants all items when every chance is 1.0 and rng returns 0', () => {
    const lootTable = [
      { itemId: 'ember_shard', count: 1, chance: 1.0 },
      { itemId: 'iron_ore', count: 2, chance: 1.0 },
    ];
    const result = rollLoot(lootTable, constant(0));
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ itemId: 'ember_shard', count: 1 });
    expect(result[1]).toEqual({ itemId: 'iron_ore', count: 2 });
  });

  // 2. All rolls fail — chance 0.0, rng returns 1 (1 < 0.0 → false)
  test('returns empty array when every chance is 0.0', () => {
    const lootTable = [
      { itemId: 'ember_shard', count: 1, chance: 0.0 },
      { itemId: 'timber', count: 3, chance: 0.0 },
    ];
    const result = rollLoot(lootTable, constant(1));
    expect(result).toEqual([]);
  });

  // 3. Mixed rolls — rng returns 0.3 then 0.8
  //    entry A chance 0.5 → 0.3 < 0.5 → granted
  //    entry B chance 0.2 → 0.8 < 0.2 → not granted
  test('grants only entries whose chance exceeds the rng roll', () => {
    const lootTable = [
      { itemId: 'ember_shard', count: 1, chance: 0.5 },
      { itemId: 'iron_ore', count: 1, chance: 0.2 },
    ];
    const result = rollLoot(lootTable, sequence(0.3, 0.8));
    expect(result).toHaveLength(1);
    expect(result[0].itemId).toBe('ember_shard');
  });

  // 4. Empty lootTable → empty result
  test('returns empty array for an empty lootTable', () => {
    expect(rollLoot([], constant(0))).toEqual([]);
  });

  // 5. Determinism — identical rng state reproduces identical result
  test('is deterministic: same rng state produces the same result', () => {
    const lootTable = [
      { itemId: 'ember_shard', count: 1, chance: 0.6 },
      { itemId: 'timber', count: 2, chance: 0.3 },
    ];
    const makeRng = () => sequence(0.5, 0.25);

    const first = rollLoot(lootTable, makeRng());
    const second = rollLoot(lootTable, makeRng());
    expect(first).toEqual(second);
  });

  // 6. Count is preserved on the granted item
  test('preserves the count value from the lootTable entry', () => {
    const lootTable = [{ itemId: 'timber', count: 7, chance: 1.0 }];
    const result = rollLoot(lootTable, constant(0));
    expect(result[0].count).toBe(7);
  });

  // 7. No mutation — the original lootTable is not modified
  test('does not mutate the lootTable argument', () => {
    const lootTable = [
      { itemId: 'ember_shard', count: 1, chance: 0.5 },
    ];
    const original = JSON.stringify(lootTable);
    rollLoot(lootTable, constant(0));
    expect(JSON.stringify(lootTable)).toBe(original);
  });
});
