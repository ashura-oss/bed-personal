// Army route definitions.
// Route order: validate required params/body fields first, then let the controller handle army logic.
import { Router } from "express";
import {
  getArmyEncounterById,
  getArmyEncounters,
  getCharacterArmyState,
  postCharacterArmyBattle,
  putCharacterArmyState
} from "../controllers/armyController.js";
import { requireAnyBodyField, requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all army encounter definitions.
// Required fields: none
// Optional fields: requiredStoryPhase query
router.get(
  "/encounters",
  getArmyEncounters
);

// Get one army encounter definition.
// Required fields: armyEncounterId parameter
// Optional fields: none
router.get(
  "/encounters/:armyEncounterId",
  requireParamFields("armyEncounterId"),
  getArmyEncounterById
);

// Get one character's army state.
// Required fields: characterId parameter
// Optional fields: none
router.get(
  "/characters/:characterId",
  requireParamFields("characterId"),
  getCharacterArmyState
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Resolve one army battle for a character.
// Required fields: characterId parameter, armyEncounterId
// Optional fields: strategy, orders
router.post(
  "/characters/:characterId/battles",
  requireParamFields("characterId"),
  requireBodyFields("armyEncounterId"),
  postCharacterArmyBattle
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Save one character's army state.
// Required fields: characterId parameter, one army state field
// Optional fields: isUnlocked, commandRank, soldiers, archers, cavalry, morale, strategy
router.put(
  "/characters/:characterId",
  requireParamFields("characterId"),
  requireAnyBodyField("isUnlocked", "commandRank", "soldiers", "archers", "cavalry", "morale", "strategy"),
  putCharacterArmyState
);

export default router;
