export const ABILITY_DEFINITIONS = Object.freeze([
  Object.freeze({
    abilityId: "ability_spark",
    name: "Spark",
    className: null,
    affinity: "Fire",
    abilityType: "opener",
    power: 5,
    comboTag: "fire-opener",
    requiredLevel: 1,
    description: "A quick flare of Mordor forge-fire that starts aggressive combos."
  }),
  Object.freeze({
    abilityId: "ability_flame_slash",
    name: "Flame Slash",
    className: "Spellblade",
    affinity: "Fire",
    abilityType: "chain",
    power: 9,
    comboTag: "fire-chain",
    requiredLevel: 1,
    description: "A burning blade strike used by spellblades who fight with ambition and speed."
  }),
  Object.freeze({
    abilityId: "ability_ash_step",
    name: "Ash Step",
    className: "Rogue",
    affinity: "Fire",
    abilityType: "utility",
    power: 6,
    comboTag: "movement",
    requiredLevel: 2,
    description: "A short burst through ember and ash that helps avoid enemy pressure."
  }),
  Object.freeze({
    abilityId: "ability_vanish",
    name: "Vanish",
    className: "Rogue",
    affinity: "Shadow",
    abilityType: "opener",
    power: 6,
    comboTag: "shadow-opener",
    requiredLevel: 1,
    description: "Slip out of sight long enough to begin a shadow combo."
  }),
  Object.freeze({
    abilityId: "ability_shadow_cut",
    name: "Shadow Cut",
    className: "Rogue",
    affinity: "Shadow",
    abilityType: "chain",
    power: 10,
    comboTag: "shadow-chain",
    requiredLevel: 1,
    description: "Strike from an enemy's blind spot with condensed shadow."
  }),
  Object.freeze({
    abilityId: "ability_bless",
    name: "Bless",
    className: "Cleric",
    affinity: "Holy",
    abilityType: "defensive",
    power: 7,
    comboTag: "holy-support",
    requiredLevel: 1,
    description: "A small protective prayer that steadies a warbound servant in dangerous places."
  }),
  Object.freeze({
    abilityId: "ability_smite",
    name: "Smite",
    className: "Paladin",
    affinity: "Holy",
    abilityType: "chain",
    power: 10,
    comboTag: "holy-chain",
    requiredLevel: 1,
    description: "A focused holy strike for warriors who carry faith into battle."
  }),
  Object.freeze({
    abilityId: "ability_quickstep",
    name: "Quickstep",
    className: null,
    affinity: "Storm",
    abilityType: "utility",
    power: 5,
    comboTag: "movement",
    requiredLevel: 1,
    description: "Move with storm-touched speed before committing to an attack."
  }),
  Object.freeze({
    abilityId: "ability_static_strike",
    name: "Static Strike",
    className: "Warrior",
    affinity: "Storm",
    abilityType: "opener",
    power: 8,
    comboTag: "storm-opener",
    requiredLevel: 1,
    description: "A sharp opening blow charged with restless storm energy."
  }),
  Object.freeze({
    abilityId: "ability_life_tap",
    name: "Life Tap",
    className: "Warlock",
    affinity: "Blood",
    abilityType: "opener",
    power: 7,
    comboTag: "blood-opener",
    requiredLevel: 1,
    description: "Trade a small measure of safety for power drawn from blood."
  }),
  Object.freeze({
    abilityId: "ability_thornbind",
    name: "Thornbind",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "utility",
    power: 8,
    comboTag: "nature-control",
    requiredLevel: 1,
    description: "Call roots from broken soil to slow an enemy's advance."
  }),
  Object.freeze({
    abilityId: "ability_verdant_strike",
    name: "Verdant Strike",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "opener",
    power: 8,
    comboTag: "nature-opener",
    requiredLevel: 1,
    description: "Open a fight with a root-guided weapon strike that marks the target."
  }),
  Object.freeze({
    abilityId: "ability_beastcall",
    name: "Beastcall",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "chain",
    power: 11,
    comboTag: "nature-chain",
    requiredLevel: 1,
    description: "Call a spectral beast through the marked path to keep pressure on the enemy."
  }),
  Object.freeze({
    abilityId: "ability_ashen_root_finish",
    name: "Ashen Root Finish",
    className: "Ranger",
    affinity: "Nature",
    abilityType: "finisher",
    power: 15,
    comboTag: "nature-finisher",
    requiredLevel: 2,
    description: "Drive ash-root growth through the battlefield as a decisive nature finisher."
  }),
  Object.freeze({
    abilityId: "ability_arcane_surge",
    name: "Arcane Surge",
    className: "Mage",
    affinity: "Arcane",
    abilityType: "finisher",
    power: 14,
    comboTag: "arcane-finisher",
    requiredLevel: 2,
    description: "Release stored willpower as a decisive burst of raw arcane force."
  })
]);

export function findAbilityDefinitionById(abilityId) {
  return ABILITY_DEFINITIONS.find((ability) => ability.abilityId === abilityId) || null;
}
