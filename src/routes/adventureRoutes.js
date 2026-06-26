// Adventure route definitions.
import { Router } from "express";
import { postAdventureAttempt } from "../controllers/adventureController.js";
import { loadCharacterFromBody } from "../controllers/characterController.js";
import { loadQuestFromBody } from "../controllers/questController.js";
import { loadUserFromBody } from "../controllers/userController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireBodyFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

//Attempt one non-combat quest with a user and character.
//Required fields: userId, characterId, questId
//Optional fields: none
router.post(
  "/attempt",
  requireBodyFields("userId", "characterId", "questId"),
  loadUserFromBody,
  loadCharacterFromBody,
  loadQuestFromBody,
  postAdventureAttempt,
  withMessage("Adventure attempt resolved."),
  sendResponse
);

export default router;
