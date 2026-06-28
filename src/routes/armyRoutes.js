// Army route definitions.
// Route order: validate input, run controller logic, attach success response, then send.
import { Router } from "express";
import {
  getArmyEncounterById,
  getArmyEncounters,
  getCharacterArmyState,
  postCharacterArmyBattle,
  putCharacterArmyState
} from "../controllers/armyController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateAnyBody, validateBody, validateParams, validateQuery } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all army encounter definitions.
// Optional fields: requiredStoryPhase query
router.get(
  "/encounters",
  validateQuery({ requiredStoryPhase: { type: "string" } }),
  getArmyEncounters,
  withMessage("Army encounters retrieved."),
  sendResponse
);

// Get one army encounter definition.
// Required fields: armyEncounterId parameter
router.get(
  "/encounters/:armyEncounterId",
  validateParams({ armyEncounterId: { type: "string" } }),
  getArmyEncounterById,
  withMessage("Army encounter retrieved."),
  sendResponse
);

// Get one character's army state.
// Required fields: characterId parameter
router.get(
  "/characters/:characterId",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  getCharacterArmyState,
  withMessage("Character army state retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Resolve one army battle for a character.
// Required fields: characterId parameter, armyEncounterId
// Optional fields: strategy, orders
router.post(
  "/characters/:characterId/battles",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  validateBody({
    armyEncounterId: { type: "string" },
    strategy: { type: "string", optional: true },
    orders: { type: "array", optional: true }
  }),
  postCharacterArmyBattle,
  withMessage("Army battle resolved."),
  sendResponse
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Save one character's army state.
// Required fields: characterId parameter, one army state field
// Optional fields: isUnlocked, commandRank, soldiers, archers, cavalry, morale, strategy
router.put(
  "/characters/:characterId",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  validateAnyBody({
    isUnlocked: { type: "integer", min: 0, max: 1 },
    commandRank: { type: "string" },
    soldiers: { type: "integer", min: 0 },
    archers: { type: "integer", min: 0 },
    cavalry: { type: "integer", min: 0 },
    morale: { type: "integer", min: 0, max: 100 },
    strategy: { type: "string" }
  }),
  putCharacterArmyState,
  withMessage("Character army state saved."),
  sendResponse
);

export default router;
