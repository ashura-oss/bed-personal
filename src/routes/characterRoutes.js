// Character route definitions.
import { Router } from "express";
import { getAdventureLogsByCharacterId } from "../controllers/adventureController.js";
import { getCharacterAbilities, unlockCharacterAbility } from "../controllers/abilityController.js";
import { deleteCharacter, getCharacterById, getCharacters, loadCharacterFromCharacterIdParam, loadCharacterFromIdParam, postCharacter, putCharacterById } from "../controllers/characterController.js";
import { loadUserFromBody } from "../controllers/userController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireAnyBodyField, requireBodyFields, requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all characters.
//Required fields: none
//Optional fields: className query
router.get(
  "/",
  getCharacters,
  withMessage("Characters retrieved."),
  sendResponse
);

//Get all adventure logs for one character.
//Required fields: characterId parameter
//Optional fields: none
router.get(
  "/:characterId/adventure-logs",
  requireParamFields("characterId"),
  loadCharacterFromCharacterIdParam,
  getAdventureLogsByCharacterId,
  withMessage("Character adventure logs retrieved."),
  sendResponse
);

//Get all unlocked abilities for one character.
//Required fields: characterId parameter
//Optional fields: none
router.get(
  "/:characterId/abilities",
  requireParamFields("characterId"),
  loadCharacterFromCharacterIdParam,
  getCharacterAbilities,
  withMessage("Character abilities retrieved."),
  sendResponse
);

//Get one character by id.
//Required fields: id parameter
//Optional fields: none
router.get(
  "/:id",
  requireParamFields("id"),
  getCharacterById,
  withMessage((locals) => `Character ${locals.data.characterName} retrieved.`),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

//Create one character for an existing user.
//Required fields: userId, characterName, origin, className, affinity
//Optional fields: none
router.post(
  "/",
  requireBodyFields("userId", "characterName", "origin", "className", "affinity"),
  loadUserFromBody,
  postCharacter,
  withMessage((locals) => `Character ${locals.data.characterName} created.`, 201),
  sendResponse
);

//Unlock one ability for a character.
//Required fields: characterId parameter, abilityId
//Optional fields: none
router.post(
  "/:characterId/unlock-ability",
  requireParamFields("characterId"),
  requireBodyFields("abilityId"),
  loadCharacterFromCharacterIdParam,
  unlockCharacterAbility,
  withMessage("Character ability unlocked.", 201),
  sendResponse
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

//Update one character by id.
//Required fields: id parameter, one update field
//Optional fields: characterName, origin, className, affinity
router.put(
  "/:id",
  requireParamFields("id"),
  requireAnyBodyField("characterName", "origin", "className", "affinity"),
  loadCharacterFromIdParam,
  putCharacterById,
  withMessage((locals) => `Character ${locals.data.characterName} updated.`),
  sendResponse
);

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

//Delete one character by id.
//Required fields: id parameter
//Optional fields: none
router.delete(
  "/:id",
  requireParamFields("id"),
  loadCharacterFromIdParam,
  deleteCharacter,
  withMessage("Character deleted.", 204),
  sendResponse
);

export default router;
