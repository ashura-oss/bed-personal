// Dialogue flag controller functions save dialogue flags for a character.
import * as dialogueFlagModel from "../models/dialogueFlagModel.js";

// Update dialogue flag.
export async function putDialogueFlag(req, res, next) {
  try {
    const character = res.locals.character;
    const value = req.body?.value;

    if (value === undefined) {
      return res.status(400).json({ message: "value is required." });
    }

    if (typeof value !== "boolean" && value !== 0 && value !== 1) {
      return res.status(400).json({ message: "value must be a boolean or 0/1." });
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
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error." });
  }
}
