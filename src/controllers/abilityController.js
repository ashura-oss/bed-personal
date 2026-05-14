import {
  createCharacterAbility,
  findAbilities,
  findAbilityById,
  findCharacterAbility
} from "../models/abilityModel.js";
import { findCharacterById } from "../models/characterModel.js";
import { findUnlockedAbilitiesByCharacterId } from "../models/comboModel.js";
import { assertOwnsUserResource } from "../middlewares/authMiddleware.js";
import { createHttpError } from "../utils/httpError.js";
import { validateAffinity, validateClassName } from "../utils/gameRules.js";
import { getOptionalString, getRequiredString } from "../utils/validate.js";

export async function getAbilities(req, res, next) {
  try {
    const className = getOptionalString(req.query, "className");
    const affinity = getOptionalString(req.query, "affinity");

    if (className !== undefined) {
      validateClassName(className);
    }

    if (affinity !== undefined) {
      validateAffinity(affinity);
    }

    const abilityList = await findAbilities({ className, affinity });

    res.status(200).json(abilityList);
  } catch (error) {
    next(error);
  }
}

export async function unlockCharacterAbility(req, res, next) {
  try {
    const characterId = req.params.characterId;
    const abilityId = getRequiredString(req.body, "abilityId");
    const character = await findCharacterById(characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, character.userId);

    const ability = await findAbilityById(abilityId);

    if (!ability) {
      throw createHttpError(404, "Not Found", "Ability was not found.");
    }

    validateAbilityUnlock(character, ability);

    const existingUnlock = await findCharacterAbility(characterId, abilityId);

    if (existingUnlock) {
      throw createHttpError(409, "Conflict", "Character already unlocked this ability.");
    }

    const characterAbility = await createCharacterAbility({ characterId, abilityId });

    res.status(201).json({
      characterAbility,
      ability
    });
  } catch (error) {
    next(error);
  }
}

export async function getCharacterAbilities(req, res, next) {
  try {
    const characterId = req.params.characterId;
    const character = await findCharacterById(characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, character.userId);

    const unlockedAbilities = await findUnlockedAbilitiesByCharacterId(characterId);

    res.status(200).json(unlockedAbilities);
  } catch (error) {
    next(error);
  }
}

function validateAbilityUnlock(character, ability) {
  if (character.level < ability.requiredLevel) {
    throw createHttpError(
      400,
      "Bad Request",
      `Character level ${character.level} is too low for this ability. Required level is ${ability.requiredLevel}.`
    );
  }

  if (ability.className !== null && ability.className !== character.className) {
    throw createHttpError(
      400,
      "Bad Request",
      `Ability requires className ${ability.className}.`
    );
  }

  if (ability.affinity !== null && ability.affinity !== character.affinity) {
    throw createHttpError(
      400,
      "Bad Request",
      `Ability requires affinity ${ability.affinity}.`
    );
  }
}
