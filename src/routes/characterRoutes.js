// Character route definitions.
import { Router } from "express";
import {
  deleteCharacter,
  getCharacterById,
  getCharacters,
  loadCharacterFromCharacterIdParam,
  loadCharacterFromIdParam,
  postCharacter,
  putCharacterById
} from "../controllers/characterController.js";
import { getCharacterAbilities, unlockCharacterAbility } from "../controllers/abilityController.js";
import { getAdventureLogsByCharacterId } from "../controllers/adventureController.js";
import { loadUserFromBody } from "../controllers/userController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List characters, optionally filtered by class.
router.get(
  "/",
  getCharacters,
  withMessage("Characters retrieved."),
  sendResponse
);

// Create a character for an existing user.
router.post(
  "/",
  loadUserFromBody,
  postCharacter,
  withMessage("Character created.", 201),
  sendResponse
);

// List adventure logs for one character.
router.get(
  "/:characterId/adventure-logs",
  loadCharacterFromCharacterIdParam,
  getAdventureLogsByCharacterId,
  withMessage("Character adventure logs retrieved."),
  sendResponse
);

// List unlocked abilities for one character.
router.get(
  "/:characterId/abilities",
  loadCharacterFromCharacterIdParam,
  getCharacterAbilities,
  withMessage("Character abilities retrieved."),
  sendResponse
);

// Unlock an ability for one character.
router.post(
  "/:characterId/unlock-ability",
  loadCharacterFromCharacterIdParam,
  unlockCharacterAbility,
  withMessage("Character ability unlocked.", 201),
  sendResponse
);

// Read one character by id.
router.get(
  "/:id",
  getCharacterById,
  withMessage("Character retrieved."),
  sendResponse
);

// Update one character after loading current stats.
router.put(
  "/:id",
  loadCharacterFromIdParam,
  putCharacterById,
  withMessage("Character updated."),
  sendResponse
);

// Delete one character after checking it exists.
router.delete(
  "/:id",
  loadCharacterFromIdParam,
  deleteCharacter,
  withMessage("Character deleted.", 204),
  sendResponse
);

export default router;
