import { Router } from "express";
import { postAdventureAttempt } from "../controllers/adventureController.js";
import { loadCharacterFromBody } from "../controllers/characterController.js";
import { loadQuestFromBody } from "../controllers/questController.js";
import { loadUserFromBody } from "../controllers/userController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// Attempt a quest with a user and character.
router.post(
  "/attempt",
  loadUserFromBody,
  loadCharacterFromBody,
  loadQuestFromBody,
  postAdventureAttempt,
  withMessage("Adventure attempt resolved."),
  sendResponse
);

export default router;
