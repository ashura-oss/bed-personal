// Progression route definitions.
// Route order: validate required params/body fields first, then let the controller save progression changes.
import { Router } from "express";
import {
  getCharacterProgression,
  putCharacterProgression,
  putCharacterQuestCompletion
} from "../controllers/progressionController.js";
import { requireAnyBodyField, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get story and quest progression for one character.
// Required fields: characterId parameter
// Optional fields: none
router.get(
  "/characters/:characterId",
  requireParamFields("characterId"),
  getCharacterProgression
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Save story and quest progression for one character.
// Required fields: characterId parameter, one progression field
// Optional fields: level, xp, hp, supplies, morale, storyPhase, commandModeUnlocked
router.put(
  "/characters/:characterId",
  requireParamFields("characterId"),
  requireAnyBodyField("level", "xp", "hp", "supplies", "morale", "storyPhase", "commandModeUnlocked"),
  putCharacterProgression
);

// Claim one quest completion for a character.
// Required fields: characterId parameter, questId parameter
// Optional fields: none
router.put(
  "/characters/:characterId/quest-completions/:questId",
  requireParamFields("characterId", "questId"),
  putCharacterQuestCompletion
);

export default router;
