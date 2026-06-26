// Progression route definitions.
import { Router } from "express";
import { loadCharacterFromCharacterIdParam } from "../controllers/characterController.js";
import { getCharacterProgression, putCharacterProgression, putCharacterQuestCompletion } from "../controllers/progressionController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireAnyBodyField, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get story and quest progression for one character.
//Required fields: characterId parameter
//Optional fields: none
router.get(
  "/characters/:characterId",
  requireParamFields("characterId"),
  loadCharacterFromCharacterIdParam,
  getCharacterProgression,
  withMessage("Character progression retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

//Save story and quest progression for one character.
//Required fields: characterId parameter, one progression field
//Optional fields: level, xp, hp, supplies, morale, storyPhase, commandModeUnlocked
router.put(
  "/characters/:characterId",
  requireParamFields("characterId"),
  requireAnyBodyField("level", "xp", "hp", "supplies", "morale", "storyPhase", "commandModeUnlocked"),
  loadCharacterFromCharacterIdParam,
  putCharacterProgression,
  withMessage("Character progression saved."),
  sendResponse
);

//Claim one quest completion for a character.
//Required fields: characterId parameter, questId parameter
//Optional fields: none
router.put(
  "/characters/:characterId/quest-completions/:questId",
  requireParamFields("characterId", "questId"),
  loadCharacterFromCharacterIdParam,
  putCharacterQuestCompletion,
  withMessage("Quest completion claimed."),
  sendResponse
);

export default router;
