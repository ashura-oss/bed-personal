// Ability controller functions validate ability requests, call ability models, and send responses.
// Fixed ability definitions come from constants; unlocked abilities are saved through models.
import { ABILITY_DEFINITIONS, findAbilityDefinitionById } from "../constants/abilities.js";
import * as abilityModel from "../models/abilityModel.js";
import * as characterModel from "../models/characterModel.js";
import * as characterInventoryModel from "../models/characterInventoryModel.js";
import { validateAffinity, validateClassName } from "../utils/gameRules.js";
import {
  createHttpError,
  getOptionalString,
  getRequiredIdParam,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Gets ability definitions, optionally filtered by class or affinity.
export async function getAbilities(req, res) {
  try {
    const className = getOptionalString(req.query, "className");
    const affinity = getOptionalString(req.query, "affinity");

    if (className !== undefined) {
      throwIfValidationError(validateClassName(className));
    }

    if (affinity !== undefined) {
      throwIfValidationError(validateAffinity(affinity));
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

    return res.status(200).json({
      message: "Abilities retrieved.",
      data: abilityList
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets all abilities already unlocked by one character.
export async function getCharacterAbilities(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

    const unlockedAbilityRows = await abilityModel.findCharacterAbilityRowsByCharacterId(characterId);
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

    return res.status(200).json({
      message: "Character abilities retrieved.",
      data: unlockedAbilities
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Unlocks an ability after checking character level, class, affinity, and cost.
export async function unlockCharacterAbility(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const abilityId = getRequiredString(req.body, "abilityId");
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

    return res.status(201).json({
      message: "Character ability unlocked.",
      data: {
        characterAbility: unlockResult.characterAbility,
        ability,
        character: unlockResult.character,
        spent: unlockResult.spent
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Converts game rule validation results into controller errors.
// This keeps constant validation messages consistent with JSON API errors.
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
    throw createHttpError(
      403,
      "Forbidden",
      `Ability requires className ${ability.className}.`
    );
  }

  if (ability.affinity !== null && ability.affinity !== character.affinity) {
    throw createHttpError(
      403,
      "Forbidden",
      `Ability requires affinity ${ability.affinity}.`
    );
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
