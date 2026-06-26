// Save slot controller functions read and write user save slots.
import * as characterModel from "../models/characterModel.js";
import * as saveSlotModel from "../models/saveSlotModel.js";

// ------------------------------------------------------------
// READ CONTROLLERS
// ------------------------------------------------------------

// Return all save slots owned by one user.
export async function getSaveSlotsForUser(req, res, next) {
  try {
    res.locals.data = await saveSlotModel.findSaveSlotsByUserId(res.locals.user.userId);
    next();
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------
// SAVE CONTROLLERS
// ------------------------------------------------------------

// Save one save slot for one user.
export async function putSaveSlotForUser(req, res, next) {
  try {
    const userId = res.locals.user.userId;
    const slotIndex = Number(req.params.slotIndex);

    if (!Number.isInteger(slotIndex) || slotIndex < 1) {
      return res.status(400).json({ message: "slotIndex must be a positive integer." });
    }

    let characterId = null;
    let slotName = `Save Slot ${slotIndex}`;

    if (req.body.characterId !== undefined && req.body.characterId !== null) {
      characterId = Number(req.body.characterId);

      if (!Number.isInteger(characterId) || characterId < 1) {
        return res.status(400).json({ message: "characterId must be a positive integer id." });
      }
    }

    if (req.body.slotName !== undefined) {
      if (typeof req.body.slotName !== "string" || req.body.slotName.trim().length === 0) {
        return res.status(400).json({ message: "slotName must be a non-empty string when provided." });
      }

      slotName = req.body.slotName.trim();
    }

    if (characterId !== null) {
      const character = await characterModel.findCharacterById(characterId);

      if (!character) {
        return res.status(404).json({ message: "Character was not found." });
      }

      if (character.userId !== userId) {
        return res.status(400).json({ message: "Character does not belong to this user." });
      }
    }

    const saveSlot = await saveSlotModel.upsertSaveSlot({ userId, characterId, slotIndex, slotName });

    res.locals.data = saveSlot;
    next();
  } catch (error) {
    next(error);
  }
}
