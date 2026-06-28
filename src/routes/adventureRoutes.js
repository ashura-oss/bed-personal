// Adventure route definitions.
// Route order: validate required body fields first, then let the controller resolve the attempt.
import { Router } from "express";
import { postAdventureAttempt } from "../controllers/adventureController.js";
import { requireBodyFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Attempt one non-combat quest with a user and character.
// Required fields: userId, characterId, questId
// Optional fields: none
router.post(
  "/attempt",
  requireBodyFields("userId", "characterId", "questId"),
  postAdventureAttempt
);

export default router;
