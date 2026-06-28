// Progression controller functions read and save story and quest progression.
// The controller validates editable fields before progression models save character/run rows.
import { findQuestDefinitionById } from "../constants/quests.js";
import * as characterModel from "../models/characterModel.js";
import * as progressionModel from "../models/progressionModel.js";
import {
  createHttpError,
  getOptionalInteger,
  getOptionalString,
  getRequiredIdParam,
  sendErrorResponse
} from "../utils/requestHelpers.js";

const DEFAULT_RUN_STATE = {
  supplies: 3,
  morale: 50,
  storyPhase: "village_rebellion",
  commandModeUnlocked: 0
};

// ------------------------------------------------------------
// PROGRESSION LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets the current story, run, and quest progression for one character.
export async function getCharacterProgression(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

    const progression = await progressionModel.findCharacterProgressionById(characterId);

    return res.status(200).json({
      message: "Character progression retrieved.",
      data: progression
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// PROGRESSION SAVE CONTROLLERS
// ------------------------------------------------------------

// Saves editable progression fields for one character.
// Character stats and run state are prepared separately before the model writes both.
export async function putCharacterProgression(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

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

    return res.status(200).json({
      message: "Character progression saved.",
      data: savedProgression
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Claims dialogue quest rewards that are not handled by combat.
// Combat and army quests are resolved elsewhere so direct claims stay limited to dialogue.
export async function putCharacterQuestCompletion(req, res) {
  try {
    const characterId = getRequiredIdParam(req.params, "characterId");

    await findRequiredCharacter(characterId);

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
      throw createHttpError(404, "Not Found", "Quest completion reward was not found.");
    }

    if (questReward.questType !== "dialogue") {
      throw createHttpError(400, "Bad Request", "Only dialogue story milestones can be claimed directly.");
    }

    const claimResult = await progressionModel.claimCharacterQuestCompletion({
      characterId,
      questReward
    });

    return res.status(200).json({
      message: "Quest completion claimed.",
      data: {
        awarded: claimResult.awarded,
        rewards: {
          xp: claimResult.awardedXp
        },
        quest: questReward,
        characterProgression: claimResult.characterProgression,
        character: claimResult.character,
        questCompletion: claimResult.questCompletion
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Builds valid character stat updates from the request body.
// Only fields provided in the request are added to the update object.
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

// Builds valid run state updates from the request body.
// Missing fields are filled from the current run state before saving.
function buildRunStateChanges(body) {
  const updates = {};
  const supplies = getOptionalInteger(body, "supplies", { min: 0 });
  const morale = getOptionalInteger(body, "morale", { min: 0, max: 100 });
  const storyPhase = getOptionalString(body, "storyPhase");
  const commandModeUnlocked = getOptionalInteger(body, "commandModeUnlocked", {
    min: 0,
    max: 1
  });

  if (supplies !== undefined) {
    updates.supplies = supplies;
  }

  if (morale !== undefined) {
    updates.morale = morale;
  }

  if (storyPhase !== undefined) {
    updates.storyPhase = storyPhase;
  }

  if (commandModeUnlocked !== undefined) {
    updates.commandModeUnlocked = commandModeUnlocked;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}
