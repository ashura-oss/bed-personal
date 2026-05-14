// Pure game logic mirrored from src/utils/gameRules.js.
// No DOM access. Safe to reuse in a Phaser scene later.

export const allowedOrigins = [
  "Exiled Noble",
  "Street Thief",
  "Cursed Scholar",
  "Temple Acolyte",
  "Village Hunter",
  "Mercenary",
  "Forgotten Heir",
  "Monster-Blooded Outcast"
];

export const allowedClasses = [
  "Warrior",
  "Mage",
  "Rogue",
  "Cleric",
  "Ranger",
  "Necromancer",
  "Paladin",
  "Spellblade",
  "Alchemist",
  "Warlock"
];

export const allowedAffinities = [
  "Fire",
  "Ice",
  "Lightning",
  "Shadow",
  "Holy",
  "Nature",
  "Blood",
  "Arcane",
  "Storm"
];

export const baseStats = Object.freeze({
  hp: 100,
  strength: 5,
  intelligence: 5,
  agility: 5,
  faith: 5,
  endurance: 5,
  charisma: 5
});

const originBonuses = {
  "Exiled Noble": { charisma: 2, intelligence: 1 },
  "Street Thief": { agility: 2, charisma: 1 },
  "Cursed Scholar": { intelligence: 2, faith: 1 },
  "Temple Acolyte": { faith: 2, charisma: 1 },
  "Village Hunter": { strength: 1, agility: 1 },
  Mercenary: { strength: 1, endurance: 2 },
  "Forgotten Heir": { charisma: 1, faith: 1, intelligence: 1 },
  "Monster-Blooded Outcast": { strength: 2, endurance: 1 }
};

const classBonuses = {
  Warrior: { strength: 3, endurance: 2, hp: 15 },
  Mage: { intelligence: 4, faith: 1 },
  Rogue: { agility: 4, charisma: 1 },
  Cleric: { faith: 4, charisma: 1 },
  Ranger: { strength: 1, agility: 2, endurance: 2 },
  Necromancer: { intelligence: 2, faith: 2, charisma: 1 },
  Paladin: { strength: 2, faith: 2, endurance: 1, hp: 10 },
  Spellblade: { strength: 2, intelligence: 2, agility: 1 },
  Alchemist: { intelligence: 3, agility: 1, charisma: 1 },
  Warlock: { intelligence: 2, faith: 1, charisma: 2 }
};

const affinityBonuses = {
  Fire: { strength: 1 },
  Ice: { intelligence: 1 },
  Lightning: { agility: 1 },
  Shadow: { agility: 1 },
  Holy: { faith: 1 },
  Nature: { faith: 1 },
  Blood: { endurance: 1 },
  Arcane: { intelligence: 1 },
  Storm: { agility: 1 }
};

export const originDescriptions = {
  "Exiled Noble": "Cast out from a stone-hall court. Speaks with practiced authority and reads people for leverage.",
  "Street Thief": "Survived the lower wards by being quicker than the guard. Trusts no one and walks light.",
  "Cursed Scholar": "Marked by forbidden study. Carries answers nobody else wants to read.",
  "Temple Acolyte": "Raised under the Sun Order's lamps. Still hears prayers when blades meet.",
  "Village Hunter": "Tracked monsters before learning the alphabet. Knows the forest before the road.",
  Mercenary: "Sold their sword in every faction war. Cares about contracts, coin, and survival.",
  "Forgotten Heir": "An old bloodline nobody remembers. Echoes of a lost banner still react to their name.",
  "Monster-Blooded Outcast": "Carries something inhuman beneath the skin. Pretends not to notice the stares."
};

export const classDescriptions = {
  Warrior: "Trades discipline for raw strength. The kind of hero who outlasts a long fight.",
  Mage: "Reads will and pattern. Channels arcane force at distance.",
  Rogue: "Faster than the guard, sharper than the council. Wins by going first.",
  Cleric: "Faith made into pressure. Heals allies and breaks the unholy.",
  Ranger: "Wilderness reader, scout, sharpshooter. Always knows the safer line.",
  Necromancer: "Speaks across the line of death. Borrows what should not be borrowed.",
  Paladin: "Oaths welded to steel. Defends and judges in the same breath.",
  Spellblade: "Half edge, half spell. Blends arcane force into close combat.",
  Alchemist: "Trusts vials over prayer. Turns ingredients into outcomes.",
  Warlock: "Made a pact. The pact made them. They still aren't sure with whom."
};

export const affinityDescriptions = {
  Fire: "Ambition and rebellion. Burns clean and burns everything.",
  Ice: "Patient and precise. Locks the world in place.",
  Lightning: "Speed and pride. Decides fights before they start.",
  Shadow: "Survival and secrecy. Unseen until necessary.",
  Holy: "Faith and order. Pushes back what the dark sent.",
  Nature: "Roots, beasts, and old breath. The world before kings.",
  Blood: "Sacrifice and hunger. Power purchased in pieces.",
  Arcane: "Pure pattern and will. Reshapes the rules quietly.",
  Storm: "Sea, sky, and freedom. Refuses every cage."
};

export function calculateCharacterStats({ origin, className, affinity, level = 1 }) {
  validateOrigin(origin);
  validateClassName(className);
  validateAffinity(affinity);

  const stats = { ...baseStats };

  applyBonuses(stats, originBonuses[origin]);
  applyBonuses(stats, classBonuses[className]);
  applyBonuses(stats, affinityBonuses[affinity]);

  stats.hp += Math.max(level - 1, 0) * 10;

  return stats;
}

export function previewStats({ origin, className, affinity }) {
  if (!origin || !className || !affinity) {
    return null;
  }

  if (
    !allowedOrigins.includes(origin) ||
    !allowedClasses.includes(className) ||
    !allowedAffinities.includes(affinity)
  ) {
    return null;
  }

  return calculateCharacterStats({ origin, className, affinity, level: 1 });
}

export function validateOrigin(origin) {
  ensureAllowed("origin", origin, allowedOrigins);
}

export function validateClassName(className) {
  ensureAllowed("className", className, allowedClasses);
}

export function validateAffinity(affinity) {
  ensureAllowed("affinity", affinity, allowedAffinities);
}

export function validateCharacterName(name) {
  if (typeof name !== "string" || name.trim().length === 0) {
    return "Character name is required.";
  }

  if (name.trim().length < 2) {
    return "Character name must be at least 2 characters.";
  }

  if (name.trim().length > 40) {
    return "Character name must be 40 characters or fewer.";
  }

  return null;
}

function applyBonuses(stats, bonuses) {
  for (const [statName, value] of Object.entries(bonuses || {})) {
    stats[statName] += value;
  }
}

function ensureAllowed(fieldName, value, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(", ")}`);
  }
}
