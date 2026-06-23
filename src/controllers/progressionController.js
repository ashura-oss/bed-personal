import { findCharacterById } from "../models/characterModel.js";
import {
  findCharacterProgressionById,
  saveCharacterProgression
} from "../models/progressionModel.js";
import {
  claimCharacterQuestCompletion,
  findMordorLocalQuestReward
} from "../models/questCompletionModel.js";
import { assertOwnsUserResource } from "../middlewares/authMiddleware.js";
import { createHttpError } from "../utils/httpError.js";
import { getOptionalInteger, getRequiredIdParam } from "../utils/validate.js";

const DEFAULT_RUN_STATE = {
  schemaVersion: 1,
  embers: 0,
  flaskCharges: 4,
  lastCheckpointX: -5,
  lastCheckpointY: 0,
  lastCheckpointZ: 4
};

export async function getCharacterProgression(req, res, next) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const existingCharacter = await findCharacterById(characterId);

    if (!existingCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, existingCharacter.userId);

    const progression = await findCharacterProgressionById(characterId);

    res.locals.data = progression;
    next();
  } catch (error) {
    next(error);
  }
}

export async function putCharacterProgression(req, res, next) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const existingCharacter = await findCharacterById(characterId);

    if (!existingCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, existingCharacter.userId);

    const characterUpdates = buildCharacterProgressionUpdates(req.body);
    const runStateChanges = buildRunStateChanges(req.body);

    if (Object.keys(characterUpdates).length === 0 && runStateChanges === null) {
      throw createHttpError(
        400,
        "Bad Request",
        "Provide at least one updatable field: level, xp, hp, schemaVersion, embers, flaskCharges, lastCheckpointX, lastCheckpointY, or lastCheckpointZ."
      );
    }

    let runStateUpdates = null;

    if (runStateChanges !== null) {
      const existingProgression = await findCharacterProgressionById(characterId);
      const currentRunState = existingProgression?.runState;

      runStateUpdates = {
        characterId,
        schemaVersion:
          runStateChanges.schemaVersion ??
          currentRunState?.schemaVersion ??
          DEFAULT_RUN_STATE.schemaVersion,
        embers: runStateChanges.embers ?? currentRunState?.embers ?? DEFAULT_RUN_STATE.embers,
        flaskCharges:
          runStateChanges.flaskCharges ??
          currentRunState?.flaskCharges ??
          DEFAULT_RUN_STATE.flaskCharges,
        lastCheckpointX:
          runStateChanges.lastCheckpointX ??
          currentRunState?.lastCheckpointX ??
          DEFAULT_RUN_STATE.lastCheckpointX,
        lastCheckpointY:
          runStateChanges.lastCheckpointY ??
          currentRunState?.lastCheckpointY ??
          DEFAULT_RUN_STATE.lastCheckpointY,
        lastCheckpointZ:
          runStateChanges.lastCheckpointZ ??
          currentRunState?.lastCheckpointZ ??
          DEFAULT_RUN_STATE.lastCheckpointZ,
        savedAt: new Date().toISOString()
      };
    }

    const savedProgression = await saveCharacterProgression({
      characterId,
      characterUpdates,
      runStateUpdates
    });

    res.locals.data = savedProgression;
    next();
  } catch (error) {
    next(error);
  }
}

export async function putCharacterQuestCompletion(req, res, next) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");
    const existingCharacter = await findCharacterById(characterId);

    if (!existingCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, existingCharacter.userId);

    const questReward = findMordorLocalQuestReward(req.params.questId);

    if (!questReward) {
      throw createHttpError(
        404,
        "Not Found",
        "Quest completion reward was not found."
      );
    }

    const claimResult = await claimCharacterQuestCompletion({
      characterId,
      questReward
    });

    res.locals.data = {
      awarded: claimResult.awarded,
      rewards: {
        xp: claimResult.awardedXp
      },
      quest: questReward,
      characterProgression: claimResult.characterProgression,
      character: claimResult.character,
      questCompletion: claimResult.questCompletion
    };
    next();
  } catch (error) {
    next(error);
  }
}

function buildCharacterProgressionUpdates(body) {
  const updates = {};
  const level = getOptionalInteger(body, "level", { min: 1 });
  const xp = getOptionalInteger(body, "xp", { min: 0 });
  const hp = getOptionalInteger(body, "hp", { min: 0 });

  if (level !== undefined) {
    updates.level = level;
  }

  if (xp !== undefined) {
    updates.xp = xp;
  }

  if (hp !== undefined) {
    updates.hp = hp;
  }

  return updates;
}

function buildRunStateChanges(body) {
  const updates = {};
  const schemaVersion = getOptionalInteger(body, "schemaVersion", { min: 1 });
  const embers = getOptionalInteger(body, "embers", { min: 0 });
  const flaskCharges = getOptionalInteger(body, "flaskCharges", { min: 0 });
  const lastCheckpointX = getOptionalFiniteNumber(body, "lastCheckpointX");
  const lastCheckpointY = getOptionalFiniteNumber(body, "lastCheckpointY");
  const lastCheckpointZ = getOptionalFiniteNumber(body, "lastCheckpointZ");
  const hasAnyCheckpointCoordinate =
    lastCheckpointX !== undefined ||
    lastCheckpointY !== undefined ||
    lastCheckpointZ !== undefined;
  const hasAllCheckpointCoordinates =
    lastCheckpointX !== undefined &&
    lastCheckpointY !== undefined &&
    lastCheckpointZ !== undefined;

  if (schemaVersion !== undefined) {
    updates.schemaVersion = schemaVersion;
  }

  if (embers !== undefined) {
    updates.embers = embers;
  }

  if (flaskCharges !== undefined) {
    updates.flaskCharges = flaskCharges;
  }

  if (hasAnyCheckpointCoordinate && !hasAllCheckpointCoordinates) {
    throw createHttpError(
      400,
      "Bad Request",
      "Provide lastCheckpointX, lastCheckpointY, and lastCheckpointZ together."
    );
  }

  if (hasAllCheckpointCoordinates) {
    updates.lastCheckpointX = lastCheckpointX;
    updates.lastCheckpointY = lastCheckpointY;
    updates.lastCheckpointZ = lastCheckpointZ;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

function getOptionalFiniteNumber(source, fieldName) {
  const value = source?.[fieldName];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw createHttpError(400, "Bad Request", `${fieldName} must be a finite number.`);
  }

  return value;
}
