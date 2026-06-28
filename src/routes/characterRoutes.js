// Character route definitions.
// Route order: validate required params/body fields first, then let the controller handle character logic.
import { Router } from "express";
import { getCharacterAbilities, unlockCharacterAbility } from "../controllers/abilityController.js";
import { getAdventureLogsByCharacterId } from "../controllers/adventureController.js";
import {
  deleteCharacter,
  getCharacterById,
  getCharacters,
  postCharacter,
  putCharacterById
} from "../controllers/characterController.js";
import { requireAnyBodyField, requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all characters.
// Required fields: none
// Optional fields: className query
router.get(
  "/",
  getCharacters
);

// Get all adventure logs for one character.
// Required fields: characterId parameter
// Optional fields: none
router.get(
  "/:characterId/adventure-logs",
  requireParamFields("characterId"),
  getAdventureLogsByCharacterId
);

// Get all unlocked abilities for one character.
// Required fields: characterId parameter
// Optional fields: none
router.get(
  "/:characterId/abilities",
  requireParamFields("characterId"),
  getCharacterAbilities
);

// Get one character by id.
// Required fields: id parameter
// Optional fields: none
router.get(
  "/:id",
  requireParamFields("id"),
  getCharacterById
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Create one character for an existing user.
// Required fields: userId, characterName, origin, className, affinity
// Optional fields: none
router.post(
  "/",
  requireBodyFields("userId", "characterName", "origin", "className", "affinity"),
  postCharacter
);

// Unlock one ability for a character.
// Required fields: characterId parameter, abilityId
// Optional fields: none
router.post(
  "/:characterId/unlock-ability",
  requireParamFields("characterId"),
  requireBodyFields("abilityId"),
  unlockCharacterAbility
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Update one character by id.
// Required fields: id parameter, one update field
// Optional fields: characterName, origin, className, affinity
router.put(
  "/:id",
  requireParamFields("id"),
  requireAnyBodyField("characterName", "origin", "className", "affinity"),
  putCharacterById
);

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

// Delete one character by id.
// Required fields: id parameter
// Optional fields: none
router.delete(
  "/:id",
  requireParamFields("id"),
  deleteCharacter
);

export default router;
