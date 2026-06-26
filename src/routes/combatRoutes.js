import { Router } from "express";
import { getCombatSession, postCombatSession, postCombatTurn } from "../controllers/combatController.js";
import { loadCharacterFromBody } from "../controllers/characterController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// Start a combat session for a character.
router.post(
  "/sessions",
  loadCharacterFromBody,
  postCombatSession,
  withMessage("Combat session started.", 201),
  sendResponse
);

// Read one combat session and its turn logs.
router.get(
  "/sessions/:combatSessionId",
  getCombatSession,
  withMessage("Combat session retrieved."),
  sendResponse
);

// Resolve one turn in a combat session.
router.post(
  "/sessions/:combatSessionId/turns",
  loadCharacterFromBody,
  postCombatTurn,
  withMessage("Combat turn resolved."),
  sendResponse
);

export default router;
