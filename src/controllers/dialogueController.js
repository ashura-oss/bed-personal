// Dialogue controller functions return dialogue data and mark dialogue completion.
// Dialogue definitions come from constants; completion flags are saved through state models.
import { DIALOGUE_DEFINITIONS, findDialogueDefinitionById } from "../constants/dialogues.js";
import * as characterModel from "../models/characterModel.js";
import * as stateModel from "../models/stateModel.js";
import { createHttpError, sendErrorResponse } from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// DIALOGUE LOOKUP CONTROLLERS
// ------------------------------------------------------------

// Gets dialogue definitions, optionally filtered by region or story phase.
export async function getDialogues(_req, res, next) {
  try {
    const { regionId, storyPhase } = res.locals;

    res.locals.data = DIALOGUE_DEFINITIONS.filter((dialogue) => {
      if (regionId !== undefined && dialogue.regionId !== regionId) {
        return false;
      }

      if (storyPhase !== undefined && dialogue.storyPhase !== storyPhase) {
        return false;
      }

      return true;
    }).sort((left, right) => left.dialogueId.localeCompare(right.dialogueId));
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one dialogue definition by id.
export async function getDialogueById(_req, res, next) {
  try {
    const dialogue = findDialogueDefinitionById(res.locals.dialogueId);

    if (!dialogue) {
      throw createHttpError(404, "Not Found", "Dialogue scene was not found.");
    }

    res.locals.data = dialogue;
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// DIALOGUE COMPLETION CONTROLLERS
// ------------------------------------------------------------

// Completes one dialogue and saves its completion flag.
export async function postDialogueCompletion(_req, res, next) {
  try {
    const { characterId, choiceId, dialogueId } = res.locals;
    const character = await findRequiredCharacter(characterId);
    const dialogue = findDialogueDefinitionById(dialogueId);

    if (!dialogue) {
      throw createHttpError(404, "Not Found", "Dialogue scene was not found.");
    }

    const selectedChoice = dialogue.choices.find((choice) => choice.choiceId === choiceId) || null;

    if (!selectedChoice) {
      throw createHttpError(400, "Bad Request", "choiceId does not exist for this dialogue.");
    }

    const dialogueFlag = await stateModel.upsertDialogueFlag({
      characterId: character.characterId,
      flagId: dialogue.completionFlagId,
      flagValue: 1
    });

    res.locals.data = {
      dialogue,
      selectedChoice,
      dialogueFlag
    };
    next();
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// CONTROLLER HELPERS
// ------------------------------------------------------------

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}
