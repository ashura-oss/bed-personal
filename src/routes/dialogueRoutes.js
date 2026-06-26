import { Router } from "express";
import { getDialogueById, getDialogues, postDialogueCompletion } from "../controllers/dialogueController.js";
import { loadCharacterFromBody } from "../middlewares/loadMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

router.get("/", getDialogues, withMessage("Dialogues retrieved."), sendResponse);

router.get("/:dialogueId", getDialogueById, withMessage("Dialogue retrieved."), sendResponse);

router.post("/:dialogueId/complete", loadCharacterFromBody, postDialogueCompletion, withMessage("Dialogue completed."), sendResponse);

export default router;
