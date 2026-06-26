// Pure character creation and stat validation helpers.
import { affinityBonuses, allowedAffinities, allowedCharacterStats, allowedClasses, allowedOrigins, baseStats, classBonuses, originBonuses } from "../constants/characterOptions.js";
import { createError } from "./errorCode.js";

const MIN_CHARACTER_NAME_LENGTH = 2;
const MAX_CHARACTER_NAME_LENGTH = 40;

export { allowedAffinities, allowedCharacterStats, allowedClasses, allowedOrigins };

// Validate fixed character creation options from constants.
export function validateOrigin(origin) {
  validateAllowedValue("origin", origin, allowedOrigins);
}

// Validate class name.
export function validateClassName(className) {
  validateAllowedValue("className", className, allowedClasses);
}

// Validate affinity.
export function validateAffinity(affinity) {
  validateAllowedValue("affinity", affinity, allowedAffinities);
}

// Validate character name.
export function validateCharacterName(characterName) {
  if (typeof characterName !== "string" || characterName.trim().length === 0) {
    throw createError(
      400,
      "Bad Request",
      "characterName is required and must be a non-empty string."
    );
  }

  const length = characterName.trim().length;
  if (length < MIN_CHARACTER_NAME_LENGTH || length > MAX_CHARACTER_NAME_LENGTH) {
    throw createError(
      400,
      "Bad Request",
      `characterName must be between ${MIN_CHARACTER_NAME_LENGTH} and ${MAX_CHARACTER_NAME_LENGTH} characters.`
    );
  }
}

// Validate required stat.
export function validateRequiredStat(requiredStat) {
  validateAllowedValue("requiredStat", requiredStat, allowedCharacterStats);
}

// Resolve non-combat quest success from the character's required stat.
export function resolveQuestAttempt(character, quest) {
  validateRequiredStat(quest.requiredStat);

  const characterStat = character[quest.requiredStat];

  if (!Number.isInteger(characterStat)) {
    throw createError(
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

// Build starting stats from origin, class, affinity, and level.
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

// Apply bonuses.
function applyBonuses(stats, bonuses) {
  for (const [statName, value] of Object.entries(bonuses || {})) {
    stats[statName] += value;
  }
}

// Calculate failure xp.
function calculateFailureXp(quest) {
  if (quest.rewardXp <= 0) {
    return 0;
  }

  return Math.min(quest.rewardXp, Math.max(5, quest.difficulty * 5));
}

// Validate allowed value.
function validateAllowedValue(fieldName, value, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw createError(400, "Bad Request", `${fieldName} must be one of the allowed values.`, {
      allowedValues
    });
  }
}
