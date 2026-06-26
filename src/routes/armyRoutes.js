import { Router } from "express";
import { getCharacterArmyState, postCharacterArmyBattle, putCharacterArmyState } from "../controllers/armyController.js";
import { loadCharacterFromCharacterIdParam } from "../controllers/characterController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// Read a character's army state.
router.get(
  "/characters/:characterId",
  loadCharacterFromCharacterIdParam,
  getCharacterArmyState,
  withMessage("Character army state retrieved."),
  sendResponse
);

// Save a character's army state.
router.put(
  "/characters/:characterId",
  loadCharacterFromCharacterIdParam,
  putCharacterArmyState,
  withMessage("Character army state saved."),
  sendResponse
);

// Resolve one army battle for a character.
router.post(
  "/characters/:characterId/battles",
  loadCharacterFromCharacterIdParam,
  postCharacterArmyBattle,
  withMessage("Army battle resolved."),
  sendResponse
);

export default router;
