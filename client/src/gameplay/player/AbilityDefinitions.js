export const ABILITY_SLOT_IDS = Object.freeze(["Q", "E", "R"]);

export const ABILITY_DEFINITIONS = Object.freeze([
  {
    abilityId: "ability_spark",
    name: "Spark",
    className: null,
    affinity: "Fire",
    abilityType: "opener",
    power: 5,
    comboTag: "fire-opener",
    requiredLevel: 1,
    description: "A quick flare of Worldheart fire that starts aggressive combos.",
    fpCost: 8,
    cooldown: 2.4,
    range: 9,
    damage: 16,
    effect: {
      kind: "damage",
      element: "Fire",
      tags: ["opener", "ranged"]
    },
    icon: "spark",
    glyph: "SPK"
  },
  {
    abilityId: "ability_flame_slash",
    name: "Flame Slash",
    className: "Spellblade",
    affinity: "Fire",
    abilityType: "chain",
    power: 9,
    comboTag: "fire-chain",
    requiredLevel: 1,
    description: "A burning blade strike used by spellblades who fight with ambition and speed.",
    fpCost: 14,
    cooldown: 4.2,
    range: 3.2,
    damage: 28,
    effect: {
      kind: "damage",
      element: "Fire",
      tags: ["chain", "melee"]
    },
    icon: "flame-slash",
    glyph: "FSL"
  },
  {
    abilityId: "ability_ash_step",
    name: "Ash Step",
    className: "Rogue",
    affinity: "Fire",
    abilityType: "utility",
    power: 6,
    comboTag: "movement",
    requiredLevel: 2,
    description: "A short burst through ember and ash that helps avoid enemy pressure.",
    fpCost: 10,
    cooldown: 5,
    range: 0,
    damage: 0,
    effect: {
      kind: "mobility",
      distance: 5,
      duration: 0.35,
      tags: ["utility", "movement"]
    },
    icon: "ash-step",
    glyph: "ASH"
  },
  {
    abilityId: "ability_vanish",
    name: "Vanish",
    className: "Rogue",
    affinity: "Shadow",
    abilityType: "opener",
    power: 6,
    comboTag: "shadow-opener",
    requiredLevel: 1,
    description: "Slip out of sight long enough to begin a shadow combo.",
    fpCost: 12,
    cooldown: 7,
    range: 0,
    damage: 0,
    effect: {
      kind: "stealth",
      duration: 2,
      tags: ["opener", "defense"]
    },
    icon: "vanish",
    glyph: "VAN"
  },
  {
    abilityId: "ability_shadow_cut",
    name: "Shadow Cut",
    className: "Rogue",
    affinity: "Shadow",
    abilityType: "chain",
    power: 10,
    comboTag: "shadow-chain",
    requiredLevel: 1,
    description: "Strike from an enemy's blind spot with condensed shadow.",
    fpCost: 16,
    cooldown: 4.8,
    range: 3,
    damage: 32,
    effect: {
      kind: "damage",
      element: "Shadow",
      tags: ["chain", "melee"]
    },
    icon: "shadow-cut",
    glyph: "SCU"
  },
  {
    abilityId: "ability_bless",
    name: "Bless",
    className: "Cleric",
    affinity: "Holy",
    abilityType: "defensive",
    power: 7,
    comboTag: "holy-support",
    requiredLevel: 1,
    description: "A small protective prayer that steadies the Unbound in dangerous places.",
    fpCost: 12,
    cooldown: 8,
    range: 0,
    damage: 0,
    effect: {
      kind: "shield",
      amount: 22,
      duration: 5,
      tags: ["defensive", "support"]
    },
    icon: "bless",
    glyph: "BLS"
  },
  {
    abilityId: "ability_smite",
    name: "Smite",
    className: "Paladin",
    affinity: "Holy",
    abilityType: "chain",
    power: 10,
    comboTag: "holy-chain",
    requiredLevel: 1,
    description: "A focused holy strike for warriors who carry faith into battle.",
    fpCost: 15,
    cooldown: 4.6,
    range: 6,
    damage: 30,
    effect: {
      kind: "damage",
      element: "Holy",
      tags: ["chain", "ranged"]
    },
    icon: "smite",
    glyph: "SMT"
  },
  {
    abilityId: "ability_quickstep",
    name: "Quickstep",
    className: null,
    affinity: "Storm",
    abilityType: "utility",
    power: 5,
    comboTag: "movement",
    requiredLevel: 1,
    description: "Move with storm-touched speed before committing to an attack.",
    fpCost: 7,
    cooldown: 3.5,
    range: 0,
    damage: 0,
    effect: {
      kind: "mobility",
      distance: 4,
      duration: 0.25,
      tags: ["utility", "movement"]
    },
    icon: "quickstep",
    glyph: "QST"
  },
  {
    abilityId: "ability_static_strike",
    name: "Static Strike",
    className: "Warrior",
    affinity: "Storm",
    abilityType: "opener",
    power: 8,
    comboTag: "storm-opener",
    requiredLevel: 1,
    description: "A sharp opening blow charged with restless storm energy.",
    fpCost: 13,
    cooldown: 3.8,
    range: 3.4,
    damage: 26,
    effect: {
      kind: "damage",
      element: "Storm",
      tags: ["opener", "melee"]
    },
    icon: "static-strike",
    glyph: "STA"
  },
  {
    abilityId: "ability_life_tap",
    name: "Life Tap",
    className: "Warlock",
    affinity: "Blood",
    abilityType: "opener",
    power: 7,
    comboTag: "blood-opener",
    requiredLevel: 1,
    description: "Trade a small measure of safety for power drawn from blood.",
    fpCost: 6,
    cooldown: 4.5,
    range: 7,
    damage: 20,
    effect: {
      kind: "leech",
      element: "Blood",
      healRatio: 0.35,
      tags: ["opener", "ranged"]
    },
    icon: "life-tap",
    glyph: "LTP"
  },
  {
    abilityId: "ability_thornbind",
    name: "Thornbind",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "utility",
    power: 8,
    comboTag: "nature-control",
    requiredLevel: 1,
    description: "Call roots from broken soil to slow an enemy's advance.",
    fpCost: 13,
    cooldown: 6,
    range: 8,
    damage: 12,
    effect: {
      kind: "snare",
      element: "Nature",
      duration: 3,
      slowRatio: 0.45,
      tags: ["utility", "control"]
    },
    icon: "thornbind",
    glyph: "THN"
  },
  {
    abilityId: "ability_verdant_strike",
    name: "Verdant Strike",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "opener",
    power: 8,
    comboTag: "nature-opener",
    requiredLevel: 1,
    description: "Open a fight with a root-guided weapon strike that marks the target.",
    fpCost: 12,
    cooldown: 3.8,
    range: 5,
    damage: 24,
    effect: {
      kind: "mark",
      element: "Nature",
      duration: 4,
      tags: ["opener", "mark"]
    },
    icon: "verdant-strike",
    glyph: "VRD"
  },
  {
    abilityId: "ability_beastcall",
    name: "Beastcall",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "chain",
    power: 11,
    comboTag: "nature-chain",
    requiredLevel: 1,
    description: "Call a spectral beast through the marked path to keep pressure on the enemy.",
    fpCost: 18,
    cooldown: 6.5,
    range: 9,
    damage: 36,
    effect: {
      kind: "damage",
      element: "Nature",
      tags: ["chain", "summon"]
    },
    icon: "beastcall",
    glyph: "BST"
  },
  {
    abilityId: "ability_heartwood_finish",
    name: "Heartwood Finish",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "finisher",
    power: 15,
    comboTag: "nature-finisher",
    requiredLevel: 2,
    description: "Drive Worldheart growth through the battlefield as a decisive nature finisher.",
    fpCost: 26,
    cooldown: 12,
    range: 7,
    damage: 52,
    effect: {
      kind: "damage",
      element: "Nature",
      tags: ["finisher", "area"]
    },
    icon: "heartwood-finish",
    glyph: "HWD"
  },
  {
    abilityId: "ability_arcane_surge",
    name: "Arcane Surge",
    className: "Mage",
    affinity: "Arcane",
    abilityType: "finisher",
    power: 14,
    comboTag: "arcane-finisher",
    requiredLevel: 2,
    description: "Release stored willpower as a decisive burst of raw arcane force.",
    fpCost: 24,
    cooldown: 11,
    range: 10,
    damage: 48,
    effect: {
      kind: "damage",
      element: "Arcane",
      tags: ["finisher", "ranged"]
    },
    icon: "arcane-surge",
    glyph: "ARC"
  }
]);

export const ABILITY_DEFINITION_BY_ID = Object.freeze(
  Object.fromEntries(ABILITY_DEFINITIONS.map((definition) => [definition.abilityId, definition]))
);

export function getAbilityDefinition(abilityId) {
  return ABILITY_DEFINITION_BY_ID[abilityId] ?? null;
}

export function isKnownAbilityId(abilityId) {
  return Boolean(getAbilityDefinition(abilityId));
}

export function getAbilityDefinitions() {
  return ABILITY_DEFINITIONS;
}

export function buildAbilityDefinitionView(definition, slot = null) {
  if (!definition) return null;

  return {
    abilityId: definition.abilityId,
    name: definition.name,
    className: definition.className,
    affinity: definition.affinity,
    abilityType: definition.abilityType,
    power: definition.power,
    comboTag: definition.comboTag,
    requiredLevel: definition.requiredLevel,
    description: definition.description,
    fpCost: definition.fpCost,
    cooldown: definition.cooldown,
    range: definition.range,
    damage: definition.damage,
    effect: definition.effect,
    icon: definition.icon,
    glyph: definition.glyph,
    slot,
    keyGlyph: slot
  };
}
