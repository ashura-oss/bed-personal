// Character controller functions handle character validation, loading, and CRUD.
import * as characterModel from "../models/characterModel.js";
import { calculateCharacterStats, validateAffinity, validateCharacterName, validateClassName, validateOrigin } from "../utils/gameRules.js";
import { createError, sendError } from "../utils/errorCode.js";

// Shared controller steps used before routes that need an existing character.
export async function loadCharacterFromCharacterIdParam(req, res, next) {
  try {
    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createError(400, "Bad Request", "characterId must be a positive integer id.");
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      throw createError(404, "Not Found", "Character was not found.");
    }

    res.locals.character = character;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Load character from id param for the next controller.
export async function loadCharacterFromIdParam(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createError(400, "Bad Request", "id must be a positive integer id.");
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      throw createError(404, "Not Found", "Character was not found.");
    }

    res.locals.character = character;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Load character from body for the next controller.
export async function loadCharacterFromBody(req, res, next) {
  try {
    const value = req.body?.characterId;
    const characterId = typeof value === "string" ? Number(value) : value;

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createError(400, "Bad Request", "characterId must be a positive integer id.");
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      throw createError(404, "Not Found", "Character was not found.");
    }

    res.locals.character = character;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Character CRUD and related read controllers.
export async function getCharacters(req, res, next) {
  try {
    let className = req.query.className;

    if (className !== undefined) {
      if (typeof className !== "string" || className.trim().length === 0) {
        throw createError(400, "Bad Request", "className must be a non-empty string.");
      }

      className = className.trim();
    }

    if (className !== undefined) {
      validateClassName(className);
    }

    const characterList = await characterModel.findCharacters({ className });

    res.locals.data = characterList;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Read one character by id.
export async function getCharacterById(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createError(400, "Bad Request", "id must be a positive integer id.");
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      throw createError(404, "Not Found", "Character was not found.");
    }

    res.locals.data = character;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Get characters by user id.
export async function getCharactersByUserId(req, res, next) {
  try {
    const characterList = await characterModel.findCharactersByUserId(res.locals.user.userId);

    res.locals.data = characterList;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Create a character after validating owner and character choices.
export async function postCharacter(req, res, next) {
  try {
    const userId = typeof req.body?.userId === "string" ? Number(req.body.userId) : req.body?.userId;

    if (!Number.isInteger(userId) || userId < 1) {
      throw createError(400, "Bad Request", "userId must be a positive integer id.");
    }

    if (typeof req.body?.characterName !== "string" || req.body.characterName.trim().length === 0) {
      throw createError(400, "Bad Request", "characterName is required.");
    }

    if (typeof req.body?.origin !== "string" || req.body.origin.trim().length === 0) {
      throw createError(400, "Bad Request", "origin is required.");
    }

    if (typeof req.body?.className !== "string" || req.body.className.trim().length === 0) {
      throw createError(400, "Bad Request", "className is required.");
    }

    if (typeof req.body?.affinity !== "string" || req.body.affinity.trim().length === 0) {
      throw createError(400, "Bad Request", "affinity is required.");
    }

    const characterName = req.body.characterName.trim();
    const origin = req.body.origin.trim();
    const className = req.body.className.trim();
    const affinity = req.body.affinity.trim();

    validateCharacterName(characterName);

    const stats = calculateCharacterStats({ origin, className, affinity });
    const character = await characterModel.createCharacter({
      userId,
      characterName,
      origin,
      className,
      affinity,
      stats
    });

    res.locals.data = character;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Update character by id.
export async function putCharacterById(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createError(400, "Bad Request", "id must be a positive integer id.");
    }

    const updates = buildCharacterUpdates(req.body, res.locals.character);
    const updatedCharacter = await characterModel.updateCharacterById(characterId, updates);

    res.locals.data = updatedCharacter;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Delete character.
export async function deleteCharacter(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createError(400, "Bad Request", "id must be a positive integer id.");
    }

    await characterModel.deleteCharacterById(characterId);

    next();
  } catch (error) {
    sendError(res, error);
  }
}

// Build allowed updates and recalculate stats if class data changes.
function buildCharacterUpdates(body, existingCharacter) {
  const updates = {};
  let characterName = body?.characterName;
  let origin = body?.origin;
  let className = body?.className;
  let affinity = body?.affinity;

  if (characterName !== undefined) {
    if (typeof characterName !== "string" || characterName.trim().length === 0) {
      throw createError(400, "Bad Request", "characterName must be a non-empty string.");
    }

    characterName = characterName.trim();
  }

  if (origin !== undefined) {
    if (typeof origin !== "string" || origin.trim().length === 0) {
      throw createError(400, "Bad Request", "origin must be a non-empty string.");
    }

    origin = origin.trim();
  }

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

  if (characterName !== undefined) {
    validateCharacterName(characterName);
    updates.characterName = characterName;
  }

  if (origin !== undefined) {
    validateOrigin(origin);
    updates.origin = origin;
  }

  if (className !== undefined) {
    validateClassName(className);
    updates.className = className;
  }

  if (affinity !== undefined) {
    validateAffinity(affinity);
    updates.affinity = affinity;
  }

  if (Object.keys(updates).length === 0) {
    throw createError(
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
