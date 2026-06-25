import { Router } from "express";
import { getDialogueById, getDialogues, postDialogueCompletion } from "../controllers/dialogueController.js";
import { loadCharacterFromBody } from "../middlewares/resourceMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getDialogues, withMessage("Dialogues retrieved."), sendResponse);

router.get("/:dialogueId", getDialogueById, withMessage("Dialogue retrieved."), sendResponse);

router.post("/:dialogueId/complete", loadCharacterFromBody, postDialogueCompletion, withMessage("Dialogue completed."), sendResponse);

export default router;
