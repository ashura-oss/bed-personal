// Dialogue route definitions.
// Route order: validate input, run controller logic, attach success response, then send.
import { Router } from "express";
import { getDialogueById, getDialogues, postDialogueCompletion } from "../controllers/dialogueController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all dialogue definitions.
// Optional fields: regionId query, storyPhase query
router.get(
  "/",
  validateQuery({
    regionId: { type: "string" },
    storyPhase: { type: "string" }
  }),
  getDialogues,
  withMessage("Dialogues retrieved."),
  sendResponse
);

// Get one dialogue definition.
// Required fields: dialogueId parameter
router.get(
  "/:dialogueId",
  validateParams({ dialogueId: { type: "string" } }),
  getDialogueById,
  withMessage("Dialogue retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Mark one dialogue as completed by a character.
// Required fields: dialogueId parameter, characterId, choiceId
router.post(
  "/:dialogueId/complete",
  validateParams({ dialogueId: { type: "string" } }),
  validateBody({
    characterId: { type: "integer", min: 1 },
    choiceId: { type: "string" }
  }),
  postDialogueCompletion,
  withMessage("Dialogue completed."),
  sendResponse
);

export default router;
