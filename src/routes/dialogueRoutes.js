// Dialogue route definitions.
import { Router } from "express";
import { getDialogueById, getDialogues, postDialogueCompletion } from "../controllers/dialogueController.js";
import { loadCharacterFromBody } from "../controllers/characterController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List all dialogue definitions.
router.get(
  "/",
  getDialogues,
  withMessage("Dialogues retrieved."),
  sendResponse
);

// Read one dialogue definition.
router.get(
  "/:dialogueId",
  getDialogueById,
  withMessage("Dialogue retrieved."),
  sendResponse
);

// Mark a dialogue as completed by a character.
router.post(
  "/:dialogueId/complete",
  loadCharacterFromBody,
  postDialogueCompletion,
  withMessage("Dialogue completed."),
  sendResponse
);

export default router;
