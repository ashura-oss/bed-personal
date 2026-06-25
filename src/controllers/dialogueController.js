import * as dialogueFlagModel from "../models/dialogueFlagModel.js";
import { DIALOGUE_DEFINITIONS, findDialogueDefinitionById } from "../constants/dialogues.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function getDialogues(req, res, next) {
  try {
    let regionId = req.query.regionId;
    let storyPhase = req.query.storyPhase;

    if (regionId !== undefined) {
      if (typeof regionId !== "string" || regionId.trim().length === 0) {
        throw createHttpError(400, "Bad Request", "regionId must be a non-empty string.");
      }

      regionId = regionId.trim();
    }

    if (storyPhase !== undefined) {
      if (typeof storyPhase !== "string" || storyPhase.trim().length === 0) {
        throw createHttpError(400, "Bad Request", "storyPhase must be a non-empty string.");
      }

      storyPhase = storyPhase.trim();
    }

    const dialogues = DIALOGUE_DEFINITIONS.filter((dialogue) => {
      if (regionId !== undefined && dialogue.regionId !== regionId) {
        return false;
      }

      if (storyPhase !== undefined && dialogue.storyPhase !== storyPhase) {
        return false;
      }

      return true;
    }).sort((left, right) => left.dialogueId.localeCompare(right.dialogueId));

    res.locals.data = dialogues;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function getDialogueById(req, res, next) {
  try {
    const dialogue = findDialogueDefinitionById(req.params.dialogueId);

    if (!dialogue) {
      throw createHttpError(404, "Not Found", "Dialogue scene was not found.");
    }

    res.locals.data = dialogue;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}

export async function postDialogueCompletion(req, res, next) {
  try {
    const character = res.locals.character;
    const choiceIdValue = req.body?.choiceId;

    if (typeof choiceIdValue !== "string" || choiceIdValue.trim().length === 0) {
      throw createHttpError(400, "Bad Request", "choiceId is required.");
    }

    const choiceId = choiceIdValue.trim();
    const dialogue = findDialogueDefinitionById(req.params.dialogueId);

    if (!dialogue) {
      throw createHttpError(404, "Not Found", "Dialogue scene was not found.");
    }

    const selectedChoice = dialogue.choices.find((choice) => choice.choiceId === choiceId) || null;

    if (!selectedChoice) {
      throw createHttpError(400, "Bad Request", "choiceId does not exist for this dialogue.");
    }

    const dialogueFlag = await dialogueFlagModel.upsertDialogueFlag({
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
    sendHttpError(res, error);
  }
}
