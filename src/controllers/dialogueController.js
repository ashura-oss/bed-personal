// Dialogue controller functions return dialogue data and mark dialogue completion.
// Dialogue definitions come from constants; completion flags are saved through state models.
import { DIALOGUE_DEFINITIONS, findDialogueDefinitionById } from "../constants/dialogues.js";
import * as characterModel from "../models/characterModel.js";
import * as stateModel from "../models/stateModel.js";
import {
  createHttpError,
  getOptionalString,
  getRequiredId,
  getRequiredString,
  sendErrorResponse
} from "../utils/requestHelpers.js";

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Gets dialogue definitions, optionally filtered by region or story phase.
export async function getDialogues(req, res) {
  try {
    const regionId = getOptionalString(req.query, "regionId");
    const storyPhase = getOptionalString(req.query, "storyPhase");
    const dialogues = DIALOGUE_DEFINITIONS.filter((dialogue) => {
      if (regionId !== undefined && dialogue.regionId !== regionId) {
        return false;
      }

      if (storyPhase !== undefined && dialogue.storyPhase !== storyPhase) {
        return false;
      }

      return true;
    }).sort((left, right) => left.dialogueId.localeCompare(right.dialogueId));

    return res.status(200).json({
      message: "Dialogues retrieved.",
      data: dialogues
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// Gets one dialogue definition by id.
export async function getDialogueById(req, res) {
  try {
    const dialogue = findDialogueDefinitionById(req.params.dialogueId);

    if (!dialogue) {
      throw createHttpError(404, "Not Found", "Dialogue scene was not found.");
    }

    return res.status(200).json({
      message: "Dialogue retrieved.",
      data: dialogue
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Completes one dialogue and saves its completion flag.
// The chosen option must exist in the fixed dialogue definition before the flag is saved.
export async function postDialogueCompletion(req, res) {
  try {
    const characterId = getRequiredId(req.body, "characterId");
    const choiceId = getRequiredString(req.body, "choiceId");
    const character = await findRequiredCharacter(characterId);
    const dialogue = findDialogueDefinitionById(req.params.dialogueId);

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

    return res.status(200).json({
      message: "Dialogue completed.",
      data: {
        dialogue,
        selectedChoice,
        dialogueFlag
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

// Finds one character or raises a 404 controller error.
async function findRequiredCharacter(characterId) {
  const character = await characterModel.findCharacterById(characterId);

  if (!character) {
    throw createHttpError(404, "Not Found", "Character was not found.");
  }

  return character;
}
