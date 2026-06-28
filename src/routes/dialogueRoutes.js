// Dialogue route definitions.
// Route order: validate required params/body fields first, then let the controller read or save dialogue state.
import { Router } from "express";
import { getDialogueById, getDialogues, postDialogueCompletion } from "../controllers/dialogueController.js";
import { requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all dialogue definitions.
// Required fields: none
// Optional fields: regionId query, storyPhase query
router.get(
  "/",
  getDialogues
);

// Get one dialogue definition.
// Required fields: dialogueId parameter
// Optional fields: none
router.get(
  "/:dialogueId",
  requireParamFields("dialogueId"),
  getDialogueById
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Mark one dialogue as completed by a character.
// Required fields: dialogueId parameter, characterId, choiceId
// Optional fields: none
router.post(
  "/:dialogueId/complete",
  requireParamFields("dialogueId"),
  requireBodyFields("characterId", "choiceId"),
  postDialogueCompletion
);

export default router;
