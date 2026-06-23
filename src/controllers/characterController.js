import {
  createCharacter,
  deleteCharacterById,
  findCharacterById,
  findCharacters,
  findCharactersByUserId,
  updateCharacterById
} from "../models/characterModel.js";
import { findUserById } from "../models/userModel.js";
import { assertOwnsUserResource } from "../middlewares/authMiddleware.js";
import {
  calculateCharacterStats,
  validateAffinity,
  validateCharacterName,
  validateClassName,
  validateOrigin
} from "../utils/gameRules.js";
import { createHttpError } from "../utils/httpError.js";
import { getOptionalString, getRequiredId, getRequiredIdParam, getRequiredString } from "../utils/validate.js";

export async function getCharacters(req, res, next) {
  try {
    const className = getOptionalString(req.query, "className");

    if (className !== undefined) {
      validateClassName(className);
    }

    const characterList = await findCharacters({ className });

    res.locals.data = characterList;
    next();
  } catch (error) {
    next(error);
  }
}

export async function getCharacterById(req, res, next) {
  try {
    const characterId = getRequiredIdParam(req.params, "id");
    const character = await findCharacterById(characterId);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, character.userId);

    res.locals.data = character;
    next();
  } catch (error) {
    next(error);
  }
}

export async function getCharactersByUserId(req, res, next) {
  try {
    const userId = getRequiredIdParam(req.params, "userId");
    const user = await findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    assertOwnsUserResource(req, userId);

    const characterList = await findCharactersByUserId(userId);

    res.locals.data = characterList;
    next();
  } catch (error) {
    next(error);
  }
}

export async function postCharacter(req, res, next) {
  try {
    const userId = getRequiredId(req.body, "userId");
    const characterName = getRequiredString(req.body, "characterName");
    const origin = getRequiredString(req.body, "origin");
    const className = getRequiredString(req.body, "className");
    const affinity = getRequiredString(req.body, "affinity");
    const user = await findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    assertOwnsUserResource(req, userId);
    validateCharacterName(characterName);

    const stats = calculateCharacterStats({ origin, className, affinity });
    const character = await createCharacter({
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
    next(error);
  }
}

export async function putCharacterById(req, res, next) {
  try {
    const characterId = getRequiredIdParam(req.params, "id");
    const existingCharacter = await findCharacterById(characterId);

    if (!existingCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, existingCharacter.userId);

    const updates = buildCharacterUpdates(req.body, existingCharacter);
    const updatedCharacter = await updateCharacterById(characterId, updates);

    res.locals.data = updatedCharacter;
    next();
  } catch (error) {
    next(error);
  }
}

export async function deleteCharacter(req, res, next) {
  try {
    const characterId = getRequiredIdParam(req.params, "id");
    const existingCharacter = await findCharacterById(characterId);

    if (!existingCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, existingCharacter.userId);

    await deleteCharacterById(characterId);

    res.locals.status = 204;
    next();
  } catch (error) {
    next(error);
  }
}

function buildCharacterUpdates(body, existingCharacter) {
  const updates = {};
  const characterName = getOptionalString(body, "characterName");
  const origin = getOptionalString(body, "origin");
  const className = getOptionalString(body, "className");
  const affinity = getOptionalString(body, "affinity");

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
