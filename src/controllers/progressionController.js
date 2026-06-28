// Progression controller functions read and save story and quest progression.
// The controller validates gameplay rules before progression models save character/run rows.
import { findQuestDefinitionById } from "../constants/quests.js";
import * as characterModel from "../models/characterModel.js";
import * as progressionModel from "../models/progressionModel.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

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
export async function getCharacterProgression(_req, res, next) {
  try {
    const { characterId } = res.locals;

    await findRequiredCharacter(characterId);

    res.locals.data = await progressionModel.findCharacterProgressionById(characterId);
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// PROGRESSION SAVE CONTROLLERS
// ------------------------------------------------------------

// Saves editable progression fields for one character.
export async function putCharacterProgression(_req, res, next) {
  try {
    const { characterId } = res.locals;

    await findRequiredCharacter(characterId);

    const characterUpdates = buildCharacterProgressionUpdates(res.locals);
    const runStateChanges = buildRunStateChanges(res.locals);
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

    res.locals.data = await progressionModel.saveCharacterProgression({
      characterId,
      characterUpdates,
      runStateUpdates
    });
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Claims dialogue quest rewards that are not handled by combat.
export async function putCharacterQuestCompletion(_req, res, next) {
  try {
    const { characterId, questId } = res.locals;

    await findRequiredCharacter(characterId);

    const quest = findQuestDefinitionById(questId);
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
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Builds valid character stat updates from validated res.locals values.
function buildCharacterProgressionUpdates(locals) {
  const updates = {};

  if (locals.level !== undefined) {
    updates.level = locals.level;
  }

  if (locals.xp !== undefined) {
    updates.xp = locals.xp;
  }

  if (locals.hp !== undefined) {
    updates.hp = locals.hp;
  }

  return updates;
}

// Builds valid run state updates from validated res.locals values.
function buildRunStateChanges(locals) {
  const updates = {};

  if (locals.supplies !== undefined) {
    updates.supplies = locals.supplies;
  }

  if (locals.morale !== undefined) {
    updates.morale = locals.morale;
  }

  if (locals.storyPhase !== undefined) {
    updates.storyPhase = locals.storyPhase;
  }

  if (locals.commandModeUnlocked !== undefined) {
    updates.commandModeUnlocked = locals.commandModeUnlocked;
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
