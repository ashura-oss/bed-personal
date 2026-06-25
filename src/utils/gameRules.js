import { affinityBonuses, allowedAffinities, allowedCharacterStats, allowedClasses, allowedOrigins, baseStats, classBonuses, originBonuses } from "../constants/characterOptions.js";
import { createHttpError } from "./httpError.js";

const MIN_CHARACTER_NAME_LENGTH = 2;
const MAX_CHARACTER_NAME_LENGTH = 40;

export { allowedAffinities, allowedCharacterStats, allowedClasses, allowedOrigins };

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
