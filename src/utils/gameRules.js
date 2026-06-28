// Pure character creation, stat validation, and non-combat quest helpers.
// Controllers call these before saving through models so game rules stay outside route files.
import {
  affinityBonuses,
  allowedAffinities,
  allowedCharacterStats,
  allowedClasses,
  allowedOrigins,
  baseStats,
  classBonuses,
  originBonuses
} from "../constants/characterOptions.js";

const MIN_CHARACTER_NAME_LENGTH = 2;
const MAX_CHARACTER_NAME_LENGTH = 40;

export { allowedAffinities, allowedCharacterStats, allowedClasses, allowedOrigins };

// Validates origin against fixed character creation options from constants.
export function validateOrigin(origin) {
  return validateAllowedValue("origin", origin, allowedOrigins);
}

// Validates class name against fixed character creation options from constants.
export function validateClassName(className) {
  return validateAllowedValue("className", className, allowedClasses);
}

// Validates affinity against fixed character creation options from constants.
export function validateAffinity(affinity) {
  return validateAllowedValue("affinity", affinity, allowedAffinities);
}

// Validates character name length and prevents blank names.
export function validateCharacterName(characterName) {
  if (typeof characterName !== "string" || characterName.trim().length === 0) {
    return "characterName is required and must be a non-empty string.";
  }

  const length = characterName.trim().length;
  if (length < MIN_CHARACTER_NAME_LENGTH || length > MAX_CHARACTER_NAME_LENGTH) {
    return `characterName must be between ${MIN_CHARACTER_NAME_LENGTH} and ${MAX_CHARACTER_NAME_LENGTH} characters.`;
  }

  return null;
}

// Validates that a quest required stat matches one of the saved character stat fields.
export function validateRequiredStat(requiredStat) {
  return validateAllowedValue("requiredStat", requiredStat, allowedCharacterStats);
}

// Resolves non-combat quest success from the character's required stat.
// This returns a result object only; the adventure model handles saving rewards and logs.
export function resolveQuestAttempt(character, quest) {
  const statError = validateRequiredStat(quest.requiredStat);

  if (statError) {
    return {
      error: {
        status: 400,
        message: statError
      }
    };
  }

  const characterStat = character[quest.requiredStat];

  if (!Number.isInteger(characterStat)) {
    return {
      error: {
        status: 500,
        message: `Character is missing the required stat ${quest.requiredStat}.`
      }
    };
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

// Builds starting stats from origin, class, affinity, and level.
// Character creation and character edits use this to keep stat calculations consistent.
export function calculateCharacterStats({ origin, className, affinity, level = 1 }) {
  const stats = {
    ...baseStats
  };

  applyBonuses(stats, originBonuses[origin]);
  applyBonuses(stats, classBonuses[className]);
  applyBonuses(stats, affinityBonuses[affinity]);

  stats.hp += Math.max(level - 1, 0) * 10;

  return stats;
}

// Applies one bonus object onto the mutable stats object.
function applyBonuses(stats, bonuses) {
  for (const [statName, value] of Object.entries(bonuses || {})) {
    stats[statName] += value;
  }
}

// Calculates partial XP for failed quests so failed attempts still give limited progress.
function calculateFailureXp(quest) {
  if (quest.rewardXp <= 0) {
    return 0;
  }

  return Math.min(quest.rewardXp, Math.max(5, quest.difficulty * 5));
}

// Validates one value against a fixed list and returns an error message when invalid.
function validateAllowedValue(fieldName, value, allowedValues) {
  if (!allowedValues.includes(value)) {
    return `${fieldName} must be one of the allowed values.`;
  }

  return null;
}
