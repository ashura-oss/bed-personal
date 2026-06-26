import * as characterModel from "../models/characterModel.js";
import * as saveSlotModel from "../models/saveSlotModel.js";
import { createError, sendError } from "../utils/errorCode.js";

export async function getSaveSlotsForUser(req, res, next) {
  try {
    res.locals.data = await saveSlotModel.findSaveSlotsByUserId(res.locals.user.userId);
    next();
  } catch (error) {
    sendError(res, error);
  }
}

export async function putSaveSlotForUser(req, res, next) {
  try {
    const userId = res.locals.user.userId;
    const slotIndex = Number(req.params.slotIndex);

    if (!Number.isInteger(slotIndex) || slotIndex < 1) {
      throw createError(400, "Bad Request", "slotIndex must be a positive integer.");
    }

    let characterId = null;
    let slotName = `Save Slot ${slotIndex}`;

    if (req.body.characterId !== undefined && req.body.characterId !== null) {
      characterId = Number(req.body.characterId);

      if (!Number.isInteger(characterId) || characterId < 1) {
        throw createError(400, "Bad Request", "characterId must be a positive integer id.");
      }
    }

    if (req.body.slotName !== undefined) {
      if (typeof req.body.slotName !== "string" || req.body.slotName.trim().length === 0) {
        throw createError(400, "Bad Request", "slotName must be a non-empty string when provided.");
      }

      slotName = req.body.slotName.trim();
    }

    if (characterId !== null) {
      const character = await characterModel.findCharacterById(characterId);

      if (!character) {
        throw createError(404, "Not Found", "Character was not found.");
      }

      if (character.userId !== userId) {
        throw createError(400, "Bad Request", "Character does not belong to this user.");
      }
    }

    const saveSlot = await saveSlotModel.upsertSaveSlot({ userId, characterId, slotIndex, slotName });

    res.locals.data = saveSlot;
    next();
  } catch (error) {
    sendError(res, error);
  }
}
