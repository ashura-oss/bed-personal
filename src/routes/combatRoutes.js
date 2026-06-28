// Combat route definitions.
// Route order: validate input, run controller logic, attach success response, then send.
import { Router } from "express";
import { getCombatSession, postCombatSession, postCombatTurn } from "../controllers/combatController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateBody, validateParams } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get one combat session and its turn logs.
// Required fields: combatSessionId parameter
router.get(
  "/sessions/:combatSessionId",
  validateParams({ combatSessionId: { type: "integer", min: 1 } }),
  getCombatSession,
  withMessage("Combat session retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Start one combat session.
// Required fields: characterId, enemyId
// Optional fields: questId, nodeId
router.post(
  "/sessions",
  validateBody({
    characterId: { type: "integer", min: 1 },
    enemyId: { type: "string" },
    questId: { type: "string", optional: true },
    nodeId: { type: "string", optional: true }
  }),
  postCombatSession,
  withMessage("Combat session started.", 201),
  sendResponse
);

// Resolve one turn in a combat session.
// Required fields: combatSessionId parameter, characterId, actionType
// Optional fields: abilityId
router.post(
  "/sessions/:combatSessionId/turns",
  validateParams({ combatSessionId: { type: "integer", min: 1 } }),
  validateBody({
    characterId: { type: "integer", min: 1 },
    actionType: { type: "string" },
    abilityId: { type: "string", optional: true }
  }),
  postCombatTurn,
  withMessage("Combat turn resolved."),
  sendResponse
);

export default router;
