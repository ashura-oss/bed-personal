import { Router } from "express";
import {
  deleteCharacter,
  getCharacterById,
  getCharacters,
  postCharacter,
  putCharacterById
} from "../controllers/characterController.js";
import { getAdventureLogsByCharacterId } from "../controllers/adventureController.js";
import {
  getCharacterAbilities,
  unlockCharacterAbility
} from "../controllers/abilityController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getCharacters, withMessage("Characters retrieved."), sendResponse);
router.post("/", authenticateToken, postCharacter, withMessage("Character created.", 201), sendResponse);
router.get(
  "/:characterId/adventure-logs",
  authenticateToken,
  getAdventureLogsByCharacterId,
  withMessage("Character adventure logs retrieved."),
  sendResponse
);
router.get(
  "/:characterId/abilities",
  authenticateToken,
  getCharacterAbilities,
  withMessage("Character abilities retrieved."),
  sendResponse
);
router.post(
  "/:characterId/unlock-ability",
  authenticateToken,
  unlockCharacterAbility,
  withMessage("Ability unlocked.", 201),
  sendResponse
);
router.get("/:id", authenticateToken, getCharacterById, withMessage("Character retrieved."), sendResponse);
router.put("/:id", authenticateToken, putCharacterById, withMessage("Character updated."), sendResponse);
router.delete("/:id", authenticateToken, deleteCharacter, withMessage("Character deleted."), sendResponse);

export default router;
