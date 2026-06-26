import * as fullStateModel from "../models/fullStateModel.js";
import { sendError } from "../utils/errorCode.js";

export async function getCharacterFullState(req, res, next) {
  try {
    const character = res.locals.character;
    const state = await fullStateModel.findFullCharacterState(character.characterId);

    res.locals.data = {
      characterId: character.characterId,
      ...state
    };
    next();
  } catch (error) {
    sendError(res, error);
  }
}
