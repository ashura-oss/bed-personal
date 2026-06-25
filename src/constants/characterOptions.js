export const allowedOrigins = [
  "Taxed Village Guard",
  "Milltown Survivor",
  "Border Scout",
  "Forge Apprentice",
  "Road Militia",
  "Exiled Noble"
];

export const allowedClasses = [
  "Soldier",
  "Hunter",
  "Smith",
  "Medic",
  "Scout",
  "Commander"
];

export const allowedAffinities = [
  "Resolve",
  "Iron",
  "Focus",
  "Mercy",
  "Command"
];

export const allowedCharacterStats = [
  "strength",
  "intelligence",
  "agility",
  "faith",
  "endurance",
  "charisma"
];

export const baseStats = {
  hp: 100,
  strength: 5,
  intelligence: 5,
  agility: 5,
  faith: 5,
  endurance: 5,
  charisma: 5
};

export const originBonuses = {
  "Taxed Village Guard": { strength: 1, endurance: 2 },
  "Milltown Survivor": { agility: 1, endurance: 1, charisma: 1 },
  "Border Scout": { agility: 2, intelligence: 1 },
  "Forge Apprentice": { strength: 1, intelligence: 1, endurance: 1 },
  "Road Militia": { strength: 1, agility: 1, charisma: 1 },
  "Exiled Noble": { charisma: 2, intelligence: 1 }
};

export const classBonuses = {
  Soldier: { strength: 3, endurance: 2, hp: 15 },
  Hunter: { agility: 3, strength: 1, endurance: 1 },
  Smith: { strength: 2, intelligence: 2, endurance: 1 },
  Medic: { intelligence: 2, faith: 2, charisma: 1 },
  Scout: { agility: 4, intelligence: 1 },
  Commander: { charisma: 3, strength: 1, endurance: 1, hp: 10 }
};

export const affinityBonuses = {
  Resolve: { endurance: 1 },
  Iron: { strength: 1 },
  Focus: { agility: 1 },
  Mercy: { faith: 1 },
  Command: { charisma: 1 }
};
