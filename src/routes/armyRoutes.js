// Army route definitions.
import { Router } from "express";
import { getArmyEncounterById, getArmyEncounters, getCharacterArmyState, postCharacterArmyBattle, putCharacterArmyState } from "../controllers/armyController.js";
import { loadCharacterFromCharacterIdParam } from "../controllers/characterController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireAnyBodyField, requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all army encounter definitions.
//Required fields: none
//Optional fields: requiredStoryPhase query
router.get(
  "/encounters",
  getArmyEncounters,
  withMessage("Army encounters retrieved."),
  sendResponse
);

//Get one army encounter definition.
//Required fields: armyEncounterId parameter
//Optional fields: none
router.get(
  "/encounters/:armyEncounterId",
  requireParamFields("armyEncounterId"),
  getArmyEncounterById,
  withMessage("Army encounter retrieved."),
  sendResponse
);

//Get one character's army state.
//Required fields: characterId parameter
//Optional fields: none
router.get(
  "/characters/:characterId",
  requireParamFields("characterId"),
  loadCharacterFromCharacterIdParam,
  getCharacterArmyState,
  withMessage("Character army state retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

//Resolve one army battle for a character.
//Required fields: characterId parameter, armyEncounterId
//Optional fields: strategy, orders
router.post(
  "/characters/:characterId/battles",
  requireParamFields("characterId"),
  requireBodyFields("armyEncounterId"),
  loadCharacterFromCharacterIdParam,
  postCharacterArmyBattle,
  withMessage("Army battle resolved."),
  sendResponse
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

//Save one character's army state.
//Required fields: characterId parameter, one army state field
//Optional fields: isUnlocked, commandRank, soldiers, archers, cavalry, morale, strategy
router.put(
  "/characters/:characterId",
  requireParamFields("characterId"),
  requireAnyBodyField("isUnlocked", "commandRank", "soldiers", "archers", "cavalry", "morale", "strategy"),
  loadCharacterFromCharacterIdParam,
  putCharacterArmyState,
  withMessage("Character army state saved."),
  sendResponse
);

export default router;
