// Combat balance values used by turn resolution helpers.
export const CLASS_DAMAGE_RANGES = [
  {
    className: "Medic",
    scalingStat: "faith",
    damageRange: { min: 1, max: 4 }
  },
  {
    className: "Smith",
    scalingStat: "strength",
    damageRange: { min: 2, max: 6 }
  },
  {
    className: "Hunter",
    scalingStat: "agility",
    damageRange: { min: 3, max: 8 }
  },
  {
    className: "Scout",
    scalingStat: "agility",
    damageRange: { min: 3, max: 9 }
  },
  {
    className: "Soldier",
    scalingStat: "strength",
    damageRange: { min: 4, max: 9 }
  },
  {
    className: "Commander",
    scalingStat: "charisma",
    damageRange: { min: 4, max: 10 }
  }
];

export const ARMY_UNIT_DAMAGE_RANGES = {
  soldiers: {
    damageRange: { min: 3, max: 5 },
    divisor: 10
  },
  archers: {
    damageRange: { min: 5, max: 8 },
    divisor: 10
  },
  cavalry: {
    damageRange: { min: 8, max: 13 },
    divisor: 10
  }
};

// Find class damage range.
export function findClassDamageRange(className) {
  return CLASS_DAMAGE_RANGES.find((classDamage) => classDamage.className === className) || null;
}
