// Character controller functions validate requests, call character models, and send responses.
// Character option validation uses constants, while saved character rows are handled by models.
import * as characterModel from "../models/characterModel.js";
import * as userModel from "../models/userModel.js";
import {
  calculateCharacterStats,
  validateAffinity,
  validateCharacterName,
  validateClassName,
  validateOrigin
} from "../utils/gameRules.js";
import {
  createHttpError,
  getOptionalString,
  getRequiredId,
  getRequiredIdParam,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Gets all characters, optionally filtered by class.
export async function getCharacters(req, res) {
  try {
    const className = getOptionalString(req.query, "className");

    if (className !== undefined) {
      validateClassNameOrThrow(className);
    }

    const characterList = await characterModel.findCharacters({ className });

    return res.status(200).json({
      message: "Characters retrieved.",
      data: characterList
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one character by id.
export async function getCharacterById(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "id");
    const character = await findRequiredCharacter(characterId);

    return res.status(200).json({
      message: "Character retrieved.",
      data: character
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets all characters owned by one user.
export async function getCharactersByUserId(req, res) {
  try {
    const userId = getRequiredIdParam(req.params, "userId");

    await findRequiredUser(userId);

    const characterList = await characterModel.findCharactersByUserId(userId);

    return res.status(200).json({
      message: "User characters retrieved.",
      data: characterList
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Creates one character after validating owner and character choices.
export async function postCharacter(req, res) {
  try {
    const userId = getRequiredId(req.body, "userId");
    const characterName = getRequiredString(req.body, "characterName");
    const origin = getRequiredString(req.body, "origin");
    const className = getRequiredString(req.body, "className");
    const affinity = getRequiredString(req.body, "affinity");

    await findRequiredUser(userId);
    validateCharacterNameOrThrow(characterName);
    validateOriginOrThrow(origin);
    validateClassNameOrThrow(className);
    validateAffinityOrThrow(affinity);

    const stats = calculateCharacterStats({ origin, className, affinity });
    const character = await characterModel.createCharacter({
      userId,
      characterName,
      origin,
      className,
      affinity,
      stats
    });

    return res.status(201).json({
      message: "Character created.",
      data: character
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Updates one character.
export async function putCharacterById(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "id");
    const existingCharacter = await findRequiredCharacter(characterId);
    const updates = buildCharacterUpdates(req.body, existingCharacter);
    const updatedCharacter = await characterModel.updateCharacterById(characterId, updates);

    return res.status(200).json({
      message: "Character updated.",
      data: updatedCharacter
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

// Deletes one character.
export async function deleteCharacter(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "id");
    const deletedCharacter = await characterModel.deleteCharacterById(characterId);

    if (!deletedCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    return res.status(204).send();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Builds allowed character update fields.
// If origin, class, or affinity changes, stats are recalculated using the same creation rules.
function buildCharacterUpdates(body, existingCharacter) {
  const updates = {};
  const characterName = getOptionalString(body, "characterName");
  const origin = getOptionalString(body, "origin");
  const className = getOptionalString(body, "className");
  const affinity = getOptionalString(body, "affinity");

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

  if (Object.keys(updates).length === 0) {
    throw createHttpError(
      400,
      "Bad Request",
      "Provide at least one updatable field: characterName, origin, className, or affinity."
    );
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

// Converts game rule validation results into controller errors.
// This keeps game-rule validation errors in the same JSON format as request errors.
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
