// Character controller functions handle character validation, loading, and CRUD.
import * as characterModel from "../models/characterModel.js";
import { calculateCharacterStats, validateAffinity, validateCharacterName, validateClassName, validateOrigin } from "../utils/gameRules.js";

// Shared controller steps used before routes that need an existing character.
export async function loadCharacterFromCharacterIdParam(req, res, next) {
  try {
    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "characterId must be a positive integer id." });
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      return res.status(404).json({ message: "Character was not found." });
    }

    res.locals.character = character;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Load character from id param for the next controller.
export async function loadCharacterFromIdParam(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "id must be a positive integer id." });
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      return res.status(404).json({ message: "Character was not found." });
    }

    res.locals.character = character;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Load character from body for the next controller.
export async function loadCharacterFromBody(req, res, next) {
  try {
    const value = req.body?.characterId;
    const characterId = typeof value === "string" ? Number(value) : value;

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "characterId must be a positive integer id." });
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      return res.status(404).json({ message: "Character was not found." });
    }

    res.locals.character = character;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Character CRUD and related read controllers.
export async function getCharacters(req, res, next) {
  try {
    let className = req.query.className;

    if (className !== undefined) {
      if (typeof className !== "string" || className.trim().length === 0) {
        return res.status(400).json({ message: "className must be a non-empty string." });
      }

      className = className.trim();
    }

    if (className !== undefined) {
      const classNameError = validateClassName(className);

      if (classNameError) {
        return res.status(400).json({ message: classNameError });
      }
    }

    const characterList = await characterModel.findCharacters({ className });

    res.locals.data = characterList;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Read one character by id.
export async function getCharacterById(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "id must be a positive integer id." });
    }

    const character = await characterModel.findCharacterById(characterId);

    if (!character) {
      return res.status(404).json({ message: "Character was not found." });
    }

    res.locals.data = character;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Get characters by user id.
export async function getCharactersByUserId(req, res, next) {
  try {
    const characterList = await characterModel.findCharactersByUserId(res.locals.user.userId);

    res.locals.data = characterList;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Create a character after validating owner and character choices.
export async function postCharacter(req, res, next) {
  try {
    const userId = typeof req.body?.userId === "string" ? Number(req.body.userId) : req.body?.userId;

    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(400).json({ message: "userId must be a positive integer id." });
    }

    if (typeof req.body?.characterName !== "string" || req.body.characterName.trim().length === 0) {
      return res.status(400).json({ message: "characterName is required." });
    }

    if (typeof req.body?.origin !== "string" || req.body.origin.trim().length === 0) {
      return res.status(400).json({ message: "origin is required." });
    }

    if (typeof req.body?.className !== "string" || req.body.className.trim().length === 0) {
      return res.status(400).json({ message: "className is required." });
    }

    if (typeof req.body?.affinity !== "string" || req.body.affinity.trim().length === 0) {
      return res.status(400).json({ message: "affinity is required." });
    }

    const characterName = req.body.characterName.trim();
    const origin = req.body.origin.trim();
    const className = req.body.className.trim();
    const affinity = req.body.affinity.trim();

    const characterNameError = validateCharacterName(characterName);

    if (characterNameError) {
      return res.status(400).json({ message: characterNameError });
    }

    const originError = validateOrigin(origin);

    if (originError) {
      return res.status(400).json({ message: originError });
    }

    const classNameError = validateClassName(className);

    if (classNameError) {
      return res.status(400).json({ message: classNameError });
    }

    const affinityError = validateAffinity(affinity);

    if (affinityError) {
      return res.status(400).json({ message: affinityError });
    }

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
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Update character by id.
export async function putCharacterById(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "id must be a positive integer id." });
    }

    const updates = buildCharacterUpdates(req.body, res.locals.character, res);

    if (!updates) {
      return;
    }

    const updatedCharacter = await characterModel.updateCharacterById(characterId, updates);

    res.locals.data = updatedCharacter;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Delete character.
export async function deleteCharacter(req, res, next) {
  try {
    const characterId = Number(req.params.id);

    if (!Number.isInteger(characterId) || characterId < 1) {
      return res.status(400).json({ message: "id must be a positive integer id." });
    }

    await characterModel.deleteCharacterById(characterId);

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}

// Build allowed updates and recalculate stats if class data changes.
function buildCharacterUpdates(body, existingCharacter, res) {
  const updates = {};
  let characterName = body?.characterName;
  let origin = body?.origin;
  let className = body?.className;
  let affinity = body?.affinity;

  if (characterName !== undefined) {
    if (typeof characterName !== "string" || characterName.trim().length === 0) {
      res.status(400).json({ message: "characterName must be a non-empty string." });
      return null;
    }

    characterName = characterName.trim();
  }

  if (origin !== undefined) {
    if (typeof origin !== "string" || origin.trim().length === 0) {
      res.status(400).json({ message: "origin must be a non-empty string." });
      return null;
    }

    origin = origin.trim();
  }

  if (className !== undefined) {
    if (typeof className !== "string" || className.trim().length === 0) {
      res.status(400).json({ message: "className must be a non-empty string." });
      return null;
    }

    className = className.trim();
  }

  if (affinity !== undefined) {
    if (typeof affinity !== "string" || affinity.trim().length === 0) {
      res.status(400).json({ message: "affinity must be a non-empty string." });
      return null;
    }

    affinity = affinity.trim();
  }

  if (characterName !== undefined) {
    const characterNameError = validateCharacterName(characterName);

    if (characterNameError) {
      res.status(400).json({ message: characterNameError });
      return null;
    }

    updates.characterName = characterName;
  }

  if (origin !== undefined) {
    const originError = validateOrigin(origin);

    if (originError) {
      res.status(400).json({ message: originError });
      return null;
    }

    updates.origin = origin;
  }

  if (className !== undefined) {
    const classNameError = validateClassName(className);

    if (classNameError) {
      res.status(400).json({ message: classNameError });
      return null;
    }

    updates.className = className;
  }

  if (affinity !== undefined) {
    const affinityError = validateAffinity(affinity);

    if (affinityError) {
      res.status(400).json({ message: affinityError });
      return null;
    }

    updates.affinity = affinity;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ message: "Provide at least one updatable field: characterName, origin, className, or affinity." });
    return null;
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
