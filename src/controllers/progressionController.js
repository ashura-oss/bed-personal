import * as progressionModel from "../models/progressionModel.js";
import * as questCompletionModel from "../models/questCompletionModel.js";
import { findQuestDefinitionById } from "../constants/quests.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

const DEFAULT_RUN_STATE = {
  supplies: 3,
  morale: 50,
  storyPhase: "village_rebellion",
  commandModeUnlocked: 0
};

export async function getCharacterProgression(req, res, next) {
  try {
    const progression = await progressionModel.findCharacterProgressionById(
      res.locals.character.characterId
    );

    res.locals.data = progression;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function putCharacterProgression(req, res, next) {
  try {
    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createHttpError(400, "Bad Request", "characterId must be a positive integer id.");
    }

    const characterUpdates = buildCharacterProgressionUpdates(req.body);
    const runStateChanges = buildRunStateChanges(req.body);

    if (Object.keys(characterUpdates).length === 0 && runStateChanges === null) {
      throw createHttpError(
        400,
        "Bad Request",
        "Provide at least one updatable field: level, xp, hp, supplies, morale, storyPhase, or commandModeUnlocked."
      );
    }

    let runStateUpdates = null;

    if (runStateChanges !== null) {
      const existingProgression = await progressionModel.findCharacterProgressionById(characterId);
      const currentRunState = existingProgression?.runState;

      runStateUpdates = {
        characterId,
        supplies: runStateChanges.supplies ?? currentRunState?.supplies ?? DEFAULT_RUN_STATE.supplies,
        morale: runStateChanges.morale ?? currentRunState?.morale ?? DEFAULT_RUN_STATE.morale,
        storyPhase:
          runStateChanges.storyPhase ??
          currentRunState?.storyPhase ??
          DEFAULT_RUN_STATE.storyPhase,
        commandModeUnlocked:
          runStateChanges.commandModeUnlocked ??
          currentRunState?.commandModeUnlocked ??
          DEFAULT_RUN_STATE.commandModeUnlocked,
        savedAt: new Date()
      };
    }

    const savedProgression = await progressionModel.saveCharacterProgression({
      characterId,
      characterUpdates,
      runStateUpdates
    });

    res.locals.data = savedProgression;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function putCharacterQuestCompletion(req, res, next) {
  try {
    const characterId = Number(req.params.characterId);

    if (!Number.isInteger(characterId) || characterId < 1) {
      throw createHttpError(400, "Bad Request", "characterId must be a positive integer id.");
    }

    const quest = findQuestDefinitionById(req.params.questId);
    const questReward = quest
      ? {
          questId: quest.questId,
          regionId: quest.regionId,
          title: quest.title,
          questType: quest.questType,
          rewardXp: quest.rewardXp
        }
      : null;

    if (!questReward) {
      throw createHttpError(
        404,
        "Not Found",
        "Quest completion reward was not found."
      );
    }

    if (questReward.questType !== "dialogue") {
      throw createHttpError(
        400,
        "Bad Request",
        "Only dialogue story milestones can be claimed directly."
      );
    }

    const claimResult = await questCompletionModel.claimCharacterQuestCompletion({
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
    sendHttpError(res, error);
  }
}

function buildCharacterProgressionUpdates(body) {
  const updates = {};

  if (body.level !== undefined) {
    if (!Number.isInteger(body.level)) {
      throw createHttpError(400, "Bad Request", "level must be an integer.");
    }

    if (body.level < 1) {
      throw createHttpError(400, "Bad Request", "level must be at least 1.");
    }

    updates.level = body.level;
  }

  if (body.xp !== undefined) {
    if (!Number.isInteger(body.xp)) {
      throw createHttpError(400, "Bad Request", "xp must be an integer.");
    }

    if (body.xp < 0) {
      throw createHttpError(400, "Bad Request", "xp must be at least 0.");
    }

    updates.xp = body.xp;
  }

  if (body.hp !== undefined) {
    if (!Number.isInteger(body.hp)) {
      throw createHttpError(400, "Bad Request", "hp must be an integer.");
    }

    if (body.hp < 0) {
      throw createHttpError(400, "Bad Request", "hp must be at least 0.");
    }

    updates.hp = body.hp;
  }

  return updates;
}

function buildRunStateChanges(body) {
  const updates = {};

  if (body.supplies !== undefined) {
    if (!Number.isInteger(body.supplies)) {
      throw createHttpError(400, "Bad Request", "supplies must be an integer.");
    }

    if (body.supplies < 0) {
      throw createHttpError(400, "Bad Request", "supplies must be at least 0.");
    }

    updates.supplies = body.supplies;
  }

  if (body.morale !== undefined) {
    if (!Number.isInteger(body.morale)) {
      throw createHttpError(400, "Bad Request", "morale must be an integer.");
    }

    if (body.morale < 0) {
      throw createHttpError(400, "Bad Request", "morale must be at least 0.");
    }

    if (body.morale > 100) {
      throw createHttpError(400, "Bad Request", "morale must be at most 100.");
    }

    updates.morale = body.morale;
  }

  if (body.storyPhase !== undefined) {
    if (typeof body.storyPhase !== "string" || body.storyPhase.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "storyPhase must be a non-empty string when provided.");
    }

    updates.storyPhase = body.storyPhase.trim();
  }

  if (body.commandModeUnlocked !== undefined) {
    if (!Number.isInteger(body.commandModeUnlocked)) {
      throw createHttpError(400, "Bad Request", "commandModeUnlocked must be an integer.");
    }

    if (body.commandModeUnlocked < 0) {
      throw createHttpError(400, "Bad Request", "commandModeUnlocked must be at least 0.");
    }

    if (body.commandModeUnlocked > 1) {
      throw createHttpError(400, "Bad Request", "commandModeUnlocked must be at most 1.");
    }

    updates.commandModeUnlocked = body.commandModeUnlocked;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}
