// Adventure route definitions.
// Route order: validate input, run controller logic, attach success response, then send.
import { Router } from "express";
import { postAdventureAttempt } from "../controllers/adventureController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateBody } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Attempt one non-combat quest with a user and character.
// Required fields: userId, characterId, questId
router.post(
  "/attempt",
  validateBody({
    userId: { type: "integer", min: 1 },
    characterId: { type: "integer", min: 1 },
    questId: { type: "string" }
  }),
  postAdventureAttempt,
  withMessage("Adventure attempt resolved."),
  sendResponse
);

export default router;
