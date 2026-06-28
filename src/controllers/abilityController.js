// Ability controller functions read fixed ability content and save unlocked abilities.
// Ability definitions stay in constants; unlocked ability rows are saved through models.
import { ABILITY_DEFINITIONS, findAbilityDefinitionById } from "../constants/abilities.js";
import * as abilityModel from "../models/abilityModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import * as characterModel from "../models/characterModel.js";
import { validateAffinity, validateClassName } from "../utils/gameRules.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// ABILITY LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets ability definitions, optionally filtered by class or affinity.
export async function getAbilities(_req, res, next) {
  try {
    const { className, affinity } = res.locals;

    if (className !== undefined) {
      throwIfValidationError(validateClassName(className));
    }

    if (affinity !== undefined) {
      throwIfValidationError(validateAffinity(affinity));
    }

    res.locals.data = ABILITY_DEFINITIONS.filter((ability) => {
      if (className !== undefined && ability.className !== className) {
        return false;
      }

      if (affinity !== undefined && ability.affinity !== affinity) {
        return false;
      }

      return true;
    }).sort((left, right) => left.requiredLevel - right.requiredLevel);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets all abilities already unlocked by one character.
export async function getCharacterAbilities(_req, res, next) {
  try {
    const { characterId } = res.locals;

    await findRequiredCharacter(characterId);

    const unlockedAbilityRows = await abilityModel.findCharacterAbilityRowsByCharacterId(characterId);

    res.locals.data = unlockedAbilityRows
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
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// ABILITY UNLOCK CONTROLLERS
// ------------------------------------------------------------

// Unlocks an ability after checking character level, class, affinity, and cost.
export async function unlockCharacterAbility(_req, res, next) {
  try {
    const { characterId, abilityId } = res.locals;
    const character = await findRequiredCharacter(characterId);
    const ability = findAbilityDefinitionById(abilityId);

    if (!ability) {
      throw createHttpError(404, "Not Found", "Ability was not found.");
    }

    validateAbilityUnlock(character, ability);

    const existingUnlock = await abilityModel.findCharacterAbility(characterId, abilityId);

    if (existingUnlock) {
      throw createHttpError(409, "Conflict", "Character already unlocked this ability.");
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
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Converts fixed game content validation messages into API errors.
function throwIfValidationError(errorMessage) {
  if (errorMessage) {
    throw createHttpError(400, "Bad Request", errorMessage);
  }
}

// Validates XP and item costs before unlocking an ability.
async function validateAbilityCost(character, ability) {
  const xpCost = Number(ability.xpCost || 0);

  if (character.xp < xpCost) {
    throw createHttpError(
      403,
      "Forbidden",
      `Character needs ${xpCost} XP to unlock this ability.`
    );
  }

  for (const requiredItem of ability.requiredItems || []) {
    const inventoryItem = await characterInventoryModel.findInventoryItemByCharacterId(
      character.characterId,
      requiredItem.itemId
    );

    if (!inventoryItem || inventoryItem.quantity < requiredItem.quantity) {
      throw createHttpError(
        403,
        "Forbidden",
        `Character needs ${requiredItem.quantity} ${requiredItem.itemId} to unlock this ability.`
      );
    }
  }
}

// Validates level, class, and affinity requirements for an ability.
function validateAbilityUnlock(character, ability) {
  if (character.level < ability.requiredLevel) {
    throw createHttpError(
      403,
      "Forbidden",
      `Character level ${character.level} is too low for this ability. Required level is ${ability.requiredLevel}.`
    );
  }

  if (ability.className !== null && ability.className !== character.className) {
    throw createHttpError(403, "Forbidden", `Ability requires className ${ability.className}.`);
  }

  if (ability.affinity !== null && ability.affinity !== character.affinity) {
    throw createHttpError(403, "Forbidden", `Ability requires affinity ${ability.affinity}.`);
  }
}

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}
