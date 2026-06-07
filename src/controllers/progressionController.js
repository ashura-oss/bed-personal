import { findCharacterById } from "../models/characterModel.js";
import {
  findCharacterProgressionById,
  saveCharacterProgression
} from "../models/progressionModel.js";
import {
  claimCharacterQuestCompletion,
  findHearthmereLocalQuestReward
} from "../models/questCompletionModel.js";
import { assertOwnsUserResource } from "../middlewares/authMiddleware.js";
import { createHttpError } from "../utils/httpError.js";
import { getOptionalInteger } from "../utils/validate.js";

const DEFAULT_RUN_STATE = {
  schemaVersion: 1,
  embers: 0,
  flaskCharges: 4,
  lastHearthlightX: -5,
  lastHearthlightY: 0,
  lastHearthlightZ: 4
};

export async function getCharacterProgression(req, res, next) {
  try {
    const existingCharacter = await findCharacterById(req.params.characterId);

    if (!existingCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, existingCharacter.userId);

    const progression = await findCharacterProgressionById(req.params.characterId);

    res.status(200).json(progression);
  } catch (error) {
    next(error);
  }
}

export async function putCharacterProgression(req, res, next) {
  try {
    const existingCharacter = await findCharacterById(req.params.characterId);

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
        "Provide at least one updatable field: level, xp, hp, schemaVersion, embers, flaskCharges, lastHearthlightX, lastHearthlightY, or lastHearthlightZ."
      );
    }

    let runStateUpdates = null;

    if (runStateChanges !== null) {
      const existingProgression = await findCharacterProgressionById(req.params.characterId);
      const currentRunState = existingProgression?.runState;

      runStateUpdates = {
        characterId: req.params.characterId,
        schemaVersion:
          runStateChanges.schemaVersion ??
          currentRunState?.schemaVersion ??
          DEFAULT_RUN_STATE.schemaVersion,
        embers: runStateChanges.embers ?? currentRunState?.embers ?? DEFAULT_RUN_STATE.embers,
        flaskCharges:
          runStateChanges.flaskCharges ??
          currentRunState?.flaskCharges ??
          DEFAULT_RUN_STATE.flaskCharges,
        lastHearthlightX:
          runStateChanges.lastHearthlightX ??
          currentRunState?.lastHearthlightX ??
          DEFAULT_RUN_STATE.lastHearthlightX,
        lastHearthlightY:
          runStateChanges.lastHearthlightY ??
          currentRunState?.lastHearthlightY ??
          DEFAULT_RUN_STATE.lastHearthlightY,
        lastHearthlightZ:
          runStateChanges.lastHearthlightZ ??
          currentRunState?.lastHearthlightZ ??
          DEFAULT_RUN_STATE.lastHearthlightZ,
        savedAt: new Date().toISOString()
      };
    }

    const savedProgression = await saveCharacterProgression({
      characterId: req.params.characterId,
      characterUpdates,
      runStateUpdates
    });

    res.status(200).json(savedProgression);
  } catch (error) {
    next(error);
  }
}

export async function putCharacterQuestCompletion(req, res, next) {
  try {
    const existingCharacter = await findCharacterById(req.params.characterId);

    if (!existingCharacter) {
      throw createHttpError(404, "Not Found", "Character was not found.");
    }

    assertOwnsUserResource(req, existingCharacter.userId);

    const questReward = findHearthmereLocalQuestReward(req.params.questId);

    if (!questReward) {
      throw createHttpError(
        404,
        "Not Found",
        "Quest completion reward was not found."
      );
    }

    const claimResult = await claimCharacterQuestCompletion({
      characterId: req.params.characterId,
      questReward
    });

    res.status(200).json({
      awarded: claimResult.awarded,
      rewards: {
        xp: claimResult.awardedXp
      },
      quest: questReward,
      characterProgression: claimResult.characterProgression,
      character: claimResult.character,
      questCompletion: claimResult.questCompletion
    });
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
  const lastHearthlightX = getOptionalFiniteNumber(body, "lastHearthlightX");
  const lastHearthlightY = getOptionalFiniteNumber(body, "lastHearthlightY");
  const lastHearthlightZ = getOptionalFiniteNumber(body, "lastHearthlightZ");
  const hasAnyHearthlightCoordinate =
    lastHearthlightX !== undefined ||
    lastHearthlightY !== undefined ||
    lastHearthlightZ !== undefined;
  const hasAllHearthlightCoordinates =
    lastHearthlightX !== undefined &&
    lastHearthlightY !== undefined &&
    lastHearthlightZ !== undefined;

  if (schemaVersion !== undefined) {
    updates.schemaVersion = schemaVersion;
  }

  if (embers !== undefined) {
    updates.embers = embers;
  }

  if (flaskCharges !== undefined) {
    updates.flaskCharges = flaskCharges;
  }

  if (hasAnyHearthlightCoordinate && !hasAllHearthlightCoordinates) {
    throw createHttpError(
      400,
      "Bad Request",
      "Provide lastHearthlightX, lastHearthlightY, and lastHearthlightZ together."
    );
  }

  if (hasAllHearthlightCoordinates) {
    updates.lastHearthlightX = lastHearthlightX;
    updates.lastHearthlightY = lastHearthlightY;
    updates.lastHearthlightZ = lastHearthlightZ;
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
