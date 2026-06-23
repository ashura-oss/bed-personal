import { createHttpError } from "./httpError.js";

const MIN_CHARACTER_NAME_LENGTH = 2;
const MAX_CHARACTER_NAME_LENGTH = 40;

export const allowedOrigins = [
  "Mordor Conscript",
  "Black Road Scout",
  "War Camp Smith",
  "Ring-Seeking Acolyte",
  "Ash Plain Hunter",
  "Haradrim Mercenary",
  "Fallen Southron Noble",
  "Uruk-Blooded Outcast"
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

export const allowedCharacterStats = [
  "strength",
  "intelligence",
  "agility",
  "faith",
  "endurance",
  "charisma"
];

export const allowedQuestTypes = ["combat", "dialogue", "exploration", "lore", "boss", "magic"];

const baseStats = {
  hp: 100,
  strength: 5,
  intelligence: 5,
  agility: 5,
  faith: 5,
  endurance: 5,
  charisma: 5
};

const originBonuses = {
  "Mordor Conscript": { strength: 1, endurance: 2 },
  "Black Road Scout": { agility: 2, endurance: 1 },
  "War Camp Smith": { strength: 1, intelligence: 1, endurance: 1 },
  "Ring-Seeking Acolyte": { intelligence: 2, faith: 1 },
  "Ash Plain Hunter": { strength: 1, agility: 1 },
  "Haradrim Mercenary": { strength: 1, charisma: 1, endurance: 1 },
  "Fallen Southron Noble": { charisma: 2, intelligence: 1 },
  "Uruk-Blooded Outcast": { strength: 2, endurance: 1 }
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

export function validateOrigin(origin) {
  validateAllowedValue("origin", origin, allowedOrigins);
}

export function validateClassName(className) {
  validateAllowedValue("className", className, allowedClasses);
}

export function validateAffinity(affinity) {
  validateAllowedValue("affinity", affinity, allowedAffinities);
}

export function validateCharacterName(characterName) {
  if (typeof characterName !== "string" || characterName.trim().length === 0) {
    throw createHttpError(
      400,
      "Bad Request",
      "characterName is required and must be a non-empty string."
    );
  }

  const length = characterName.trim().length;
  if (length < MIN_CHARACTER_NAME_LENGTH || length > MAX_CHARACTER_NAME_LENGTH) {
    throw createHttpError(
      400,
      "Bad Request",
      `characterName must be between ${MIN_CHARACTER_NAME_LENGTH} and ${MAX_CHARACTER_NAME_LENGTH} characters.`
    );
  }
}

export function validateRequiredStat(requiredStat) {
  validateAllowedValue("requiredStat", requiredStat, allowedCharacterStats);
}

export function validateQuestType(questType) {
  validateAllowedValue("questType", questType, allowedQuestTypes);
}

export function resolveQuestAttempt(character, quest) {
  validateRequiredStat(quest.requiredStat);

  const characterStat = character[quest.requiredStat];

  if (!Number.isInteger(characterStat)) {
    throw createHttpError(
      500,
      "Internal Server Error",
      `Character is missing the required stat ${quest.requiredStat}.`
    );
  }

  const levelBonus = Math.max(character.level - 1, 0);
  const totalScore = characterStat + levelBonus;
  const isSuccess = totalScore >= quest.requiredStatValue;
  const outcome = isSuccess ? "success" : "failure";
  const xpGained = isSuccess ? quest.rewardXp : calculateFailureXp(quest);
  const goldGained = isSuccess ? quest.rewardGold : 0;
  const resultText = isSuccess ? quest.successText : quest.failureText;

  return {
    outcome,
    isSuccess,
    xpGained,
    goldGained,
    resultText,
    challenge: {
      requiredStat: quest.requiredStat,
      characterStat,
      levelBonus,
      totalScore,
      requiredStatValue: quest.requiredStatValue,
      difficulty: quest.difficulty
    }
  };
}

export function calculateCharacterStats({ origin, className, affinity, level = 1 }) {
  validateOrigin(origin);
  validateClassName(className);
  validateAffinity(affinity);

  const stats = {
    ...baseStats
  };

  applyBonuses(stats, originBonuses[origin]);
  applyBonuses(stats, classBonuses[className]);
  applyBonuses(stats, affinityBonuses[affinity]);

  stats.hp += Math.max(level - 1, 0) * 10;

  return stats;
}

function applyBonuses(stats, bonuses) {
  for (const [statName, value] of Object.entries(bonuses || {})) {
    stats[statName] += value;
  }
}

function calculateFailureXp(quest) {
  if (quest.rewardXp <= 0) {
    return 0;
  }

  return Math.min(quest.rewardXp, Math.max(5, quest.difficulty * 5));
}

function validateAllowedValue(fieldName, value, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw createHttpError(400, "Bad Request", `${fieldName} must be one of the allowed values.`, {
      allowedValues
    });
  }
}
