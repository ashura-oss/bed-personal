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
import { calculateCharacterStats, validateAffinity, validateClassName, validateOrigin } from "../utils/gameRules.js";
import { createHttpError } from "../utils/httpError.js";
import { getOptionalString, getRequiredString } from "../utils/validate.js";

export async function getCharacters(req, res, next) {
  try {
    const className = getOptionalString(req.query, "className");

    if (className !== undefined) {
      validateClassName(className);
    }

    const characterList = await findCharacters({ className });

    res.status(200).json(characterList);
  } catch (error) {
    next(error);
  }
}

export async function getCharacterById(req, res, next) {
  try {
    const character = await findCharacterById(req.params.id);

    if (!character) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, character.userId);

    res.status(200).json(character);
  } catch (error) {
    next(error);
  }
}

export async function getCharactersByUserId(req, res, next) {
  try {
    const user = await findUserById(req.params.userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    assertOwnsUserResource(req, req.params.userId);

    const characterList = await findCharactersByUserId(req.params.userId);

    res.status(200).json(characterList);
  } catch (error) {
    next(error);
  }
}

export async function postCharacter(req, res, next) {
  try {
    const userId = getRequiredString(req.body, "userId");
    const characterName = getRequiredString(req.body, "characterName");
    const origin = getRequiredString(req.body, "origin");
    const className = getRequiredString(req.body, "className");
    const affinity = getRequiredString(req.body, "affinity");
    const user = await findUserById(userId);

    if (!user) {
      throw createHttpError(404, "Not Found", "User was not found.");
    }

    assertOwnsUserResource(req, userId);

    const stats = calculateCharacterStats({ origin, className, affinity });
    const character = await createCharacter({
      userId,
      characterName,
      origin,
      className,
      affinity,
      stats
    });

    res.status(201).json(character);
  } catch (error) {
    next(error);
  }
}

export async function putCharacterById(req, res, next) {
  try {
    const existingCharacter = await findCharacterById(req.params.id);

    if (!existingCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, existingCharacter.userId);

    const updates = buildCharacterUpdates(req.body, existingCharacter);
    const updatedCharacter = await updateCharacterById(req.params.id, updates);

    res.status(200).json(updatedCharacter);
  } catch (error) {
    next(error);
  }
}

export async function deleteCharacter(req, res, next) {
  try {
    const existingCharacter = await findCharacterById(req.params.id);

    if (!existingCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, existingCharacter.userId);

    await deleteCharacterById(req.params.id);

    res.status(204).send();
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
