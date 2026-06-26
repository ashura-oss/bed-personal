// Dialogue route definitions.
import { Router } from "express";
import { getDialogueById, getDialogues, postDialogueCompletion } from "../controllers/dialogueController.js";
import { loadCharacterFromBody } from "../controllers/characterController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all dialogue definitions.
//Required fields: none
//Optional fields: regionId query, storyPhase query
router.get(
  "/",
  getDialogues,
  withMessage("Dialogues retrieved."),
  sendResponse
);

//Get one dialogue definition.
//Required fields: dialogueId parameter
//Optional fields: none
router.get(
  "/:dialogueId",
  requireParamFields("dialogueId"),
  getDialogueById,
  withMessage("Dialogue retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

//Mark one dialogue as completed by a character.
//Required fields: dialogueId parameter, characterId, choiceId
//Optional fields: none
router.post(
  "/:dialogueId/complete",
  requireParamFields("dialogueId"),
  requireBodyFields("characterId", "choiceId"),
  loadCharacterFromBody,
  postDialogueCompletion,
  withMessage("Dialogue completed."),
  sendResponse
);

export default router;
