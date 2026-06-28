// Combat route definitions.
// Route order: validate required combat input first, then let the controller create or resolve sessions.
import { Router } from "express";
import { getCombatSession, postCombatSession, postCombatTurn } from "../controllers/combatController.js";
import { requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get one combat session and its turn logs.
// Required fields: combatSessionId parameter
// Optional fields: none
router.get(
  "/sessions/:combatSessionId",
  requireParamFields("combatSessionId"),
  getCombatSession
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Start one combat session.
// Required fields: characterId, enemyId
// Optional fields: questId, nodeId
router.post(
  "/sessions",
  requireBodyFields("characterId", "enemyId"),
  postCombatSession
);

// Resolve one turn in a combat session.
// Required fields: combatSessionId parameter, characterId, actionType
// Optional fields: abilityId
router.post(
  "/sessions/:combatSessionId/turns",
  requireParamFields("combatSessionId"),
  requireBodyFields("characterId", "actionType"),
  postCombatTurn
);

export default router;
