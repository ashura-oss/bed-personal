import * as dialogueFlagModel from "../models/dialogueFlagModel.js";
import { createHttpError, sendHttpError } from "../utils/httpError.js";

export async function putDialogueFlag(req, res, next) {
  try {
    const character = res.locals.character;
    const value = req.body?.value;

    if (value === undefined) {
      throw createHttpError(400, "Bad Request", "value is required.");
    }

    if (typeof value !== "boolean" && value !== 0 && value !== 1) {
      throw createHttpError(400, "Bad Request", "value must be a boolean or 0/1.");
    }

    const flagValue = typeof value === "boolean" ? Number(value) : value;
    const dialogueFlag = await dialogueFlagModel.upsertDialogueFlag({
      characterId: character.characterId,
      flagId: req.params.flagId,
      flagValue
    });

    res.locals.data = dialogueFlag;
    next();
  } catch (error) {
    sendHttpError(res, error);
  }
}
