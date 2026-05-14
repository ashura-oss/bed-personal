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

const router = Router();

router.get("/", getCharacters);
router.post("/", authenticateToken, postCharacter);
router.get("/:characterId/adventure-logs", authenticateToken, getAdventureLogsByCharacterId);
router.get("/:characterId/abilities", authenticateToken, getCharacterAbilities);
router.post("/:characterId/unlock-ability", authenticateToken, unlockCharacterAbility);
router.get("/:id", authenticateToken, getCharacterById);
router.put("/:id", authenticateToken, putCharacterById);
router.delete("/:id", authenticateToken, deleteCharacter);

export default router;
