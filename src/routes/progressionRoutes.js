import { Router } from "express";
import { loadCharacterFromCharacterIdParam } from "../controllers/characterController.js";
import { getCharacterProgression, putCharacterProgression, putCharacterQuestCompletion } from "../controllers/progressionController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// Read story and quest progression for a character.
router.get(
  "/characters/:characterId",
  loadCharacterFromCharacterIdParam,
  getCharacterProgression,
  withMessage("Character progression retrieved."),
  sendResponse
);

// Save story and quest progression for a character.
router.put(
  "/characters/:characterId",
  loadCharacterFromCharacterIdParam,
  putCharacterProgression,
  withMessage("Character progression saved."),
  sendResponse
);

// Claim or update one quest completion for a character.
router.put(
  "/characters/:characterId/quest-completions/:questId",
  loadCharacterFromCharacterIdParam,
  putCharacterQuestCompletion,
  withMessage("Quest completion claimed."),
  sendResponse
);

export default router;
