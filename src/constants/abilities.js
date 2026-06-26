// Ability definitions used for unlocks and combat choices.
export const ABILITY_DEFINITIONS = [
  {
    abilityId: "ability_basic_slash",
    name: "Basic Slash",
    className: null,
    affinity: null,
    abilityType: "attack",
    power: 6,
    damageRange: {
      min: 3,
      max: 6
    },
    xpCost: 0,
    requiredItems: [],
    combatTag: "melee",
    requiredLevel: 1,
    description: "A direct sword strike used by new rebels in turn-based combat."
  },
  {
    abilityId: "ability_rebel_strike",
    name: "Rebel Strike",
    className: null,
    affinity: null,
    abilityType: "attack",
    power: 12,
    damageRange: {
      min: 7,
      max: 14
    },
    xpCost: 20,
    requiredItems: [],
    combatTag: "melee",
    requiredLevel: 2,
    description: "A practiced rebel strike learned after surviving the first road battles."
  },
  {
    abilityId: "ability_westward_drive",
    name: "Westward Drive",
    className: null,
    affinity: null,
    abilityType: "attack",
    power: 17,
    damageRange: {
      min: 11,
      max: 20
    },
    xpCost: 35,
    requiredItems: [],
    combatTag: "melee",
    requiredLevel: 3,
    description: "A stronger advance used after the rebellion begins marching toward Eregion."
  },
  {
    abilityId: "ability_siege_breaker",
    name: "Siege Breaker",
    className: null,
    affinity: null,
    abilityType: "attack",
    power: 23,
    damageRange: {
      min: 16,
      max: 28
    },
    xpCost: 60,
    requiredItems: [],
    combatTag: "siege",
    requiredLevel: 5,
    description: "A late-game attack for breaking elite guards during the final siege."
  },
  {
    abilityId: "ability_guard_break",
    name: "Guard Break",
    className: "Soldier",
    affinity: "Iron",
    abilityType: "attack",
    power: 10,
    damageRange: {
      min: 6,
      max: 12
    },
    xpCost: 10,
    requiredItems: [
      { itemId: "item_iron_scrap", quantity: 1 }
    ],
    combatTag: "melee",
    requiredLevel: 1,
    description: "A heavy strike meant to crack decorated elven shields."
  },
  {
    abilityId: "ability_rally",
    name: "Rally",
    className: null,
    affinity: "Resolve",
    abilityType: "support",
    power: 7,
    xpCost: 5,
    requiredItems: [],
    combatTag: "morale",
    requiredLevel: 1,
    description: "Steady yourself and nearby allies before the enemy turn."
  },
  {
    abilityId: "ability_aimed_shot",
    name: "Aimed Shot",
    className: "Hunter",
    affinity: "Focus",
    abilityType: "attack",
    power: 11,
    damageRange: {
      min: 5,
      max: 14
    },
    xpCost: 10,
    requiredItems: [
      { itemId: "item_oak_timber", quantity: 1 }
    ],
    combatTag: "ranged",
    requiredLevel: 1,
    description: "Pick a weak point in enemy armor and loose a careful shot."
  },
  {
    abilityId: "ability_field_medicine",
    name: "Field Medicine",
    className: "Medic",
    affinity: "Mercy",
    abilityType: "heal",
    power: 24,
    healingRange: {
      min: 20,
      max: 34
    },
    xpCost: 10,
    requiredItems: [
      { itemId: "item_healing_herb", quantity: 1 },
      { itemId: "item_linen_wrap", quantity: 1 }
    ],
    combatTag: "healing",
    requiredLevel: 1,
    description: "Patch wounds during a fight and keep the rebellion standing."
  },
  {
    abilityId: "ability_smoke_flank",
    name: "Smoke Flank",
    className: "Scout",
    affinity: "Focus",
    abilityType: "attack",
    power: 12,
    damageRange: {
      min: 7,
      max: 15
    },
    xpCost: 20,
    requiredItems: [],
    combatTag: "tactics",
    requiredLevel: 2,
    description: "Use smoke and movement to strike from a safer angle."
  },
  {
    abilityId: "ability_forge_temper",
    name: "Forge Temper",
    className: "Smith",
    affinity: "Iron",
    abilityType: "support",
    power: 10,
    xpCost: 20,
    requiredItems: [
      { itemId: "item_iron_scrap", quantity: 2 }
    ],
    combatTag: "repair",
    requiredLevel: 2,
    description: "Use battlefield repairs to strengthen the next attack."
  },
  {
    abilityId: "ability_oathbreaker_stance",
    name: "Oathbreaker Stance",
    className: "Soldier",
    affinity: "Resolve",
    abilityType: "defend",
    power: 8,
    xpCost: 20,
    requiredItems: [],
    combatTag: "guard",
    requiredLevel: 2,
    description: "Brace against incoming damage without giving ground."
  },
  {
    abilityId: "ability_crown_ring_command",
    name: "Crown Ring Command",
    className: "Commander",
    affinity: "Command",
    abilityType: "command",
    power: 16,
    xpCost: 40,
    requiredItems: [
      { itemId: "item_crown_ring_shard", quantity: 1 }
    ],
    combatTag: "army",
    requiredLevel: 3,
    description: "Issue a ring-backed command after mankind crowns its first king."
  },
  {
    abilityId: "ability_shield_wall",
    name: "Shield Wall",
    className: "Commander",
    affinity: "Command",
    abilityType: "defend",
    power: 14,
    xpCost: 30,
    requiredItems: [
      { itemId: "item_command_banner", quantity: 1 }
    ],
    combatTag: "army",
    requiredLevel: 3,
    description: "Order soldiers to hold a line while the commander prepares the next move."
  },
  {
    abilityId: "ability_line_charge",
    name: "Line Charge",
    className: "Commander",
    affinity: "Command",
    abilityType: "attack",
    power: 18,
    damageRange: {
      min: 10,
      max: 20
    },
    xpCost: 50,
    requiredItems: [],
    combatTag: "army",
    requiredLevel: 4,
    description: "Send the human line forward in a coordinated strike."
  },
  {
    abilityId: "ability_last_banner",
    name: "Last Banner",
    className: "Commander",
    affinity: "Resolve",
    abilityType: "ultimate",
    power: 22,
    damageRange: {
      min: 14,
      max: 26
    },
    xpCost: 70,
    requiredItems: [
      { itemId: "item_crown_ring_shard", quantity: 1 }
    ],
    combatTag: "morale",
    requiredLevel: 5,
    description: "Raise the last human banner and turn desperation into victory."
  }
];

// Find ability definition by id.
export function findAbilityDefinitionById(abilityId) {
  return ABILITY_DEFINITIONS.find((ability) => ability.abilityId === abilityId) || null;
}
