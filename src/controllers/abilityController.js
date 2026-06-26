// Ability controller functions validate requests and prepare ability responses.
import * as abilityModel from "../models/abilityModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import { ABILITY_DEFINITIONS, findAbilityDefinitionById } from "../constants/abilities.js";
import { createError, sendError } from "../utils/errorCode.js";
import { validateAffinity, validateClassName } from "../utils/gameRules.js";

// Return fixed ability definitions, optionally filtered by class or affinity.
export async function getAbilities(req, res, next) {
  try {
    let className = req.query.className;
    let affinity = req.query.affinity;

    if (className !== undefined) {
      if (typeof className !== "string" || className.trim().length === 0) {
        throw createError(400, "Bad Request", "className must be a non-empty string.");
      }

      className = className.trim();
    }

    if (affinity !== undefined) {
      if (typeof affinity !== "string" || affinity.trim().length === 0) {
        throw createError(400, "Bad Request", "affinity must be a non-empty string.");
      }

      affinity = affinity.trim();
    }

    if (className !== undefined) {
      validateClassName(className);
    }

    if (affinity !== undefined) {
      validateAffinity(affinity);
    }

    const abilityList = ABILITY_DEFINITIONS.filter((ability) => {
      if (className !== undefined && ability.className !== className) {
        return false;
      }

      if (affinity !== undefined && ability.affinity !== affinity) {
        return false;
      }

      return true;
    }).sort((left, right) => left.requiredLevel - right.requiredLevel);

    res.locals.data = abilityList;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Unlock an ability after checking character level, class, affinity, and cost.
export async function unlockCharacterAbility(req, res, next) {
  try {
    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createError(400, "Bad Request", "characterId must be a positive integer id.");
    }

    if (typeof req.body?.abilityId !== "string" || req.body.abilityId.trim().length === 0) {
      throw createError(400, "Bad Request", "abilityId is required.");
    }

    const abilityId = req.body.abilityId.trim();
    const character = res.locals.character;

    const ability = findAbilityDefinitionById(abilityId);

    if (!ability) {
      throw createError(404, "Not Found", "Ability was not found.");
    }

    validateAbilityUnlock(character, ability);

    const existingUnlock = await abilityModel.findCharacterAbility(characterId, abilityId);

    if (existingUnlock) {
      throw createError(409, "Conflict", "Character already unlocked this ability.");
    }

    await validateAbilityCost(character, ability);

    const unlockResult = await abilityModel.createCharacterAbility({ character, ability });

    res.locals.data = {
      characterAbility: unlockResult.characterAbility,
      ability,
      character: unlockResult.character,
      spent: unlockResult.spent
    };
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Return abilities already unlocked by one character.
export async function getCharacterAbilities(req, res, next) {
  try {
    const unlockedAbilityRows = await abilityModel.findCharacterAbilityRowsByCharacterId(
      res.locals.character.characterId
    );
    const unlockedAbilities = unlockedAbilityRows
      .map((unlockRow) => {
        const ability = findAbilityDefinitionById(unlockRow.abilityId);

        if (!ability) {
          return null;
        }

        return {
          characterAbilityId: unlockRow.characterAbilityId,
          unlockedAt: unlockRow.unlockedAt,
          ...ability
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.requiredLevel - right.requiredLevel);

    res.locals.data = unlockedAbilities;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Requirement helpers keep unlockCharacterAbility readable.
async function validateAbilityCost(character, ability) {
  const xpCost = Number(ability.xpCost || 0);

  if (character.xp < xpCost) {
    throw createError(
      400,
      "Bad Request",
      `Character needs ${xpCost} XP to unlock this ability.`
    );
  }

  for (const requiredItem of ability.requiredItems || []) {
    const inventoryItem = await characterInventoryModel.findInventoryItemByCharacterId(
      character.characterId,
      requiredItem.itemId
    );

    if (!inventoryItem || inventoryItem.quantity < requiredItem.quantity) {
      throw createError(
        400,
        "Bad Request",
        `Character needs ${requiredItem.quantity} ${requiredItem.itemId} to unlock this ability.`
      );
    }
  }
}

// Validate ability unlock.
function validateAbilityUnlock(character, ability) {
  if (character.level < ability.requiredLevel) {
    throw createError(
      400,
      "Bad Request",
      `Character level ${character.level} is too low for this ability. Required level is ${ability.requiredLevel}.`
    );
  }

  if (ability.className !== null && ability.className !== character.className) {
    throw createError(
      400,
      "Bad Request",
      `Ability requires className ${ability.className}.`
    );
  }

  if (ability.affinity !== null && ability.affinity !== character.affinity) {
    throw createError(
      400,
      "Bad Request",
      `Ability requires affinity ${ability.affinity}.`
    );
  }
}
