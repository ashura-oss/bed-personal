import * as characterModel from "../models/characterModel.js";
import { calculateCharacterStats, validateAffinity, validateCharacterName, validateClassName, validateOrigin } from "../utils/gameRules.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function getCharacters(req, res, next) {
  try {
    let className = req.query.className;

    if (className !== undefined) {
      if (typeof className !== "string" || className.trim().length === 0) {
        throw createHttpError(400, "Bad Request", "className must be a non-empty string.");
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
    sendHttpError(res, error);
  }
}

export async function getCharacterById(req, res, next) {
  try {
    res.locals.data = res.locals.character;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getCharactersByUserId(req, res, next) {
  try {
    const characterList = await characterModel.findCharactersByUserId(res.locals.user.userId);

    res.locals.data = characterList;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function postCharacter(req, res, next) {
  try {
    const userId = typeof req.body?.userId === "string" ? Number(req.body.userId) : req.body?.userId;

    if (!Number.isInteger(userId) || userId < 1) {
      throw createHttpError(400, "Bad Request", "userId must be a positive integer id.");
    }

    if (typeof req.body?.characterName !== "string" || req.body.characterName.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "characterName is required.");
    }

    if (typeof req.body?.origin !== "string" || req.body.origin.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "origin is required.");
    }

    if (typeof req.body?.className !== "string" || req.body.className.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "className is required.");
    }

    if (typeof req.body?.affinity !== "string" || req.body.affinity.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "affinity is required.");
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
    sendHttpError(res, error);
  }
}

export async function putCharacterById(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createHttpError(400, "Bad Request", "id must be a positive integer id.");
    }

    const updates = buildCharacterUpdates(req.body, res.locals.character);
    const updatedCharacter = await characterModel.updateCharacterById(characterId, updates);

    res.locals.data = updatedCharacter;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function deleteCharacter(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createHttpError(400, "Bad Request", "id must be a positive integer id.");
    }

    await characterModel.deleteCharacterById(characterId);

    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

function buildCharacterUpdates(body, existingCharacter) {
  const updates = {};
  let characterName = body?.characterName;
  let origin = body?.origin;
  let className = body?.className;
  let affinity = body?.affinity;

  if (characterName !== undefined) {
    if (typeof characterName !== "string" || characterName.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "characterName must be a non-empty string.");
    }

    characterName = characterName.trim();
  }

  if (origin !== undefined) {
    if (typeof origin !== "string" || origin.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "origin must be a non-empty string.");
    }

    origin = origin.trim();
  }

  if (className !== undefined) {
    if (typeof className !== "string" || className.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "className must be a non-empty string.");
    }

    className = className.trim();
  }

  if (affinity !== undefined) {
    if (typeof affinity !== "string" || affinity.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "affinity must be a non-empty string.");
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
