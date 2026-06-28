// Character controller functions validate game choices, call character models, and pass data forward.
// Character option checks use fixed game content, while saved character rows use models.
import * as characterModel from "../models/characterModel.js";
import * as userModel from "../models/userModel.js";
import {
  calculateCharacterStats,
  validateAffinity,
  validateCharacterName,
  validateClassName,
  validateOrigin
} from "../utils/gameRules.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// CHARACTER LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets all characters, optionally filtered by class.
export async function getCharacters(_req, res, next) {
  try {
    const { className } = res.locals;

    if (className !== undefined) {
      validateClassNameOrThrow(className);
    }

    res.locals.data = await characterModel.findCharacters({ className });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one character by id.
export async function getCharacterById(_req, res, next) {
  try {
    res.locals.data = await findRequiredCharacter(res.locals.characterId);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets all characters owned by one user.
export async function getCharactersByUserId(_req, res, next) {
  try {
    const { userId } = res.locals;

    await findRequiredUser(userId);

    res.locals.data = await characterModel.findCharactersByUserId(userId);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CHARACTER CREATION CONTROLLERS
// ------------------------------------------------------------

// Creates one character after validating owner and character choices.
export async function postCharacter(_req, res, next) {
  try {
    const { userId, characterName, origin, className, affinity } = res.locals;

    await findRequiredUser(userId);
    validateCharacterNameOrThrow(characterName);
    validateOriginOrThrow(origin);
    validateClassNameOrThrow(className);
    validateAffinityOrThrow(affinity);

    const stats = calculateCharacterStats({ origin, className, affinity });

    res.locals.data = await characterModel.createCharacter({
      userId,
      characterName,
      origin,
      className,
      affinity,
      stats
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CHARACTER UPDATE CONTROLLERS
// ------------------------------------------------------------

// Updates one character and recalculates stats when build choices change.
export async function putCharacterById(_req, res, next) {
  try {
    const { characterId } = res.locals;
    const existingCharacter = await findRequiredCharacter(characterId);
    const updates = buildCharacterUpdates(res.locals, existingCharacter);

    res.locals.data = await characterModel.updateCharacterById(characterId, updates);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CHARACTER DELETE CONTROLLERS
// ------------------------------------------------------------

// Deletes one character and lets the model clean up dependent gameplay rows.
export async function deleteCharacter(_req, res, next) {
  try {
    const deletedCharacter = await characterModel.deleteCharacterById(res.locals.characterId);

    if (!deletedCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Builds allowed character update fields from validated res.locals values.
function buildCharacterUpdates(locals, existingCharacter) {
  const updates = {};
  const { characterName, origin, className, affinity } = locals;

  if (characterName !== undefined) {
    validateCharacterNameOrThrow(characterName);
    updates.characterName = characterName;
  }

  if (origin !== undefined) {
    validateOriginOrThrow(origin);
    updates.origin = origin;
  }

  if (className !== undefined) {
    validateClassNameOrThrow(className);
    updates.className = className;
  }

  if (affinity !== undefined) {
    validateAffinityOrThrow(affinity);
    updates.affinity = affinity;
  }

  if (origin !== undefined || className !== undefined || affinity !== undefined) {
    const stats = calculateCharacterStats({
      origin: origin || existingCharacter.origin,
      className: className || existingCharacter.className,
      affinity: affinity || existingCharacter.affinity,
      level: existingCharacter.level
    });

    updates.hp = stats.hp;
    updates.strength = stats.strength;
    updates.intelligence = stats.intelligence;
    updates.agility = stats.agility;
    updates.faith = stats.faith;
    updates.endurance = stats.endurance;
    updates.charisma = stats.charisma;
  }

  return updates;
}

// Converts fixed game content validation messages into API errors.
function throwIfValidationError(errorMessage) {
  if (errorMessage) {
    throw createHttpError(400, "Bad Request", errorMessage);
  }
}

// Validates character name.
function validateCharacterNameOrThrow(characterName) {
  throwIfValidationError(validateCharacterName(characterName));
}

// Validates origin.
function validateOriginOrThrow(origin) {
  throwIfValidationError(validateOrigin(origin));
}

// Validates class.
function validateClassNameOrThrow(className) {
  throwIfValidationError(validateClassName(className));
}

// Validates affinity.
function validateAffinityOrThrow(affinity) {
  throwIfValidationError(validateAffinity(affinity));
}

// Finds one user or raises a 404 controller error.
async function findRequiredUser(userId) {
  const user = await userModel.findUserById(userId);

  if (!user) {
    throw createHttpError(404, "Not Found", "User was not found.");
  }

  return user;
}

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}
