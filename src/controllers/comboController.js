import { findCharacterById } from "../models/characterModel.js";
import { findUnlockedAbilitiesByCharacterId } from "../models/comboModel.js";
import { recordAdventureAttempt } from "../models/adventureModel.js";
import { findQuestById } from "../models/questModel.js";
import { findUserById } from "../models/userModel.js";
import { assertOwnsUserResource } from "../middlewares/authMiddleware.js";
import { createHttpError } from "../utils/httpError.js";
import { resolveComboBattle } from "../utils/comboRules.js";
import { buildCharacterProgression, buildUserProgression } from "../utils/leveling.js";
import { getOptionalString, getRequiredId } from "../utils/validate.js";

const maxComboAbilities = 5;

export async function postResolveCombo(req, res, next) {
  try {
    const characterId = getRequiredId(req.body, "characterId");
    const abilityIds = getRequiredAbilityIds(req.body);
    const questId = getOptionalString(req.body, "questId");
    const enemyId = getOptionalString(req.body, "enemyId");

    if (questId !== undefined && enemyId !== undefined) {
      throw createHttpError(
        400,
        "Bad Request",
        "Provide either questId or enemyId, not both."
      );
    }

    const character = await findCharacterById(characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, character.userId);

    const unlockedAbilities = await findUnlockedAbilitiesByCharacterId(characterId);
    const selectedAbilities = getSelectedUnlockedAbilities(abilityIds, unlockedAbilities);
    const quest = questId === undefined ? null : await findQuestById(questId);

    if (questId !== undefined && !quest) {
      throw createHttpError(404, "Not Found", "Quest was not found.");
    }

    if (quest && Number(character.level || 1) < Number(quest.requiredLevel || 1)) {
      throw createHttpError(
        400,
        "Bad Request",
        `Character level ${character.level} is too low for this boss quest. Required level is ${quest.requiredLevel}.`
      );
    }

    const comboResult = resolveComboBattle({
      character,
      abilities: selectedAbilities,
      quest,
      enemyId: enemyId || null
    });

    if (quest?.questType === "boss") {
      const savedBossResult = await saveBossComboResult({
        character,
        quest,
        comboResult
      });

      res.locals.data = savedBossResult;
      next();
      return;
    }

    res.locals.data = comboResult;
    next();
  } catch (error) {
    next(error);
  }
}

function getRequiredAbilityIds(body) {
  const value = body?.abilityIds;

  if (!Array.isArray(value)) {
    throw createHttpError(400, "Bad Request", "abilityIds must be an array of strings.");
  }

  if (value.length === 0) {
    throw createHttpError(400, "Bad Request", "abilityIds must include at least one ability.");
  }

  if (value.length > maxComboAbilities) {
    throw createHttpError(
      400,
      "Bad Request",
      `A combo can include at most ${maxComboAbilities} abilities.`
    );
  }

  const abilityIds = value.map((abilityId, index) => {
    if (typeof abilityId !== "string" || abilityId.trim().length === 0) {
      throw createHttpError(
        400,
        "Bad Request",
        `abilityIds[${index}] must be a non-empty string.`
      );
    }

    return abilityId.trim();
  });

  const uniqueAbilityIds = new Set(abilityIds);

  if (uniqueAbilityIds.size !== abilityIds.length) {
    throw createHttpError(400, "Bad Request", "abilityIds cannot contain duplicates.");
  }

  return abilityIds;
}

function getSelectedUnlockedAbilities(abilityIds, unlockedAbilities) {
  const unlockedAbilityMap = new Map(
    unlockedAbilities.map((ability) => [ability.abilityId, ability])
  );
  const missingAbilityIds = abilityIds.filter((abilityId) => !unlockedAbilityMap.has(abilityId));

  if (missingAbilityIds.length > 0) {
    throw createHttpError(
      400,
      "Bad Request",
      "Character has not unlocked all selected abilities.",
      { missingAbilityIds }
    );
  }

  return abilityIds.map((abilityId) => unlockedAbilityMap.get(abilityId));
}

async function saveBossComboResult({ character, quest, comboResult }) {
  const user = await findUserById(character.userId);

  if (!user) {
    throw createHttpError(404, "Not Found", "User was not found.");
  }

  const outcome = comboResult.target?.outcome === "combo_success" ? "success" : "failure";
  const rewardPreview = comboResult.target?.rewardPreview || {};
  const xpGained = Number(rewardPreview.xp || 0);
  const goldGained = Number(rewardPreview.gold || 0);
  const characterProgression = buildCharacterProgression(character, xpGained);
  const userProgression = buildUserProgression(user, xpGained, goldGained);
  const resultText = buildBossResultText({ quest, comboResult, outcome });
  const savedAttempt = await recordAdventureAttempt({
    userId: character.userId,
    characterId: character.characterId,
    questId: quest.questId,
    outcome,
    xpGained,
    goldGained,
    resultText,
    characterUpdates: characterProgression.updates,
    userUpdates: userProgression.updates
  });

  return {
    ...comboResult,
    outcome,
    resultText,
    rewards: {
      xp: xpGained,
      gold: goldGained
    },
    target: {
      ...comboResult.target,
      rewardPreview: {
        ...rewardPreview,
        isAwarded: true
      }
    },
    quest: {
      questId: quest.questId,
      title: quest.title,
      questType: quest.questType,
      requiredLevel: quest.requiredLevel,
      difficulty: quest.difficulty
    },
    characterProgression: characterProgression.summary,
    userProgression: userProgression.summary,
    character: savedAttempt.character,
    user: savedAttempt.user,
    adventureLog: savedAttempt.adventureLog
  };
}

function buildBossResultText({ quest, comboResult, outcome }) {
  const questText = outcome === "success" ? quest.successText : quest.failureText;
  return `${questText} ${comboResult.narrationText}`;
}
