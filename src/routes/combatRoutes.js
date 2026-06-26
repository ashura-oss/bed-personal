// Combat route definitions.
import { Router } from "express";
import { getCombatSession, postCombatSession, postCombatTurn } from "../controllers/combatController.js";
import { loadCharacterFromBody } from "../controllers/characterController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get one combat session and its turn logs.
//Required fields: combatSessionId parameter
//Optional fields: none
router.get(
  "/sessions/:combatSessionId",
  requireParamFields("combatSessionId"),
  getCombatSession,
  withMessage("Combat session retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

//Start one combat session.
//Required fields: characterId, enemyId
//Optional fields: questId, nodeId
router.post(
  "/sessions",
  requireBodyFields("characterId", "enemyId"),
  loadCharacterFromBody,
  postCombatSession,
  withMessage("Combat session started.", 201),
  sendResponse
);

//Resolve one turn in a combat session.
//Required fields: combatSessionId parameter, characterId, actionType
//Optional fields: abilityId
router.post(
  "/sessions/:combatSessionId/turns",
  requireParamFields("combatSessionId"),
  requireBodyFields("characterId", "actionType"),
  loadCharacterFromBody,
  postCombatTurn,
  withMessage("Combat turn resolved."),
  sendResponse
);

export default router;
