// Progression route definitions.
// Each route validates request input before the controller saves progression data.
import { Router } from "express";
import {
  getCharacterProgression,
  putCharacterProgression,
  putCharacterQuestCompletion
} from "../controllers/progressionController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateAnyBody, validateParams } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get story and quest progression for one character.
// Required fields: characterId parameter
router.get(
  "/characters/:characterId",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  getCharacterProgression,
  withMessage("Character progression retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Save story and quest progression for one character.
// Required fields: characterId parameter, one progression field
// Optional fields: level, xp, hp, supplies, morale, storyPhase, commandModeUnlocked
router.put(
  "/characters/:characterId",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  validateAnyBody({
    level: { type: "integer", min: 1 },
    xp: { type: "integer", min: 0 },
    hp: { type: "integer", min: 0 },
    supplies: { type: "integer", min: 0 },
    morale: { type: "integer", min: 0, max: 100 },
    storyPhase: { type: "string" },
    commandModeUnlocked: { type: "bit" }
  }),
  putCharacterProgression,
  withMessage("Character progression saved."),
  sendResponse
);

// Claim one dialogue quest completion for a character.
// Required fields: characterId parameter, questId parameter
router.put(
  "/characters/:characterId/quest-completions/:questId",
  validateParams({
    characterId: { type: "integer", min: 1 },
    questId: { type: "string" }
  }),
  putCharacterQuestCompletion,
  withMessage("Quest completion claimed."),
  sendResponse
);

export default router;
