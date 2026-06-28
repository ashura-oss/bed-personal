// Character route definitions.
// Route order: validate input, run controller logic, attach success response, then send.
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
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateAnyBody, validateBody, validateParams, validateQuery } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all characters.
// Optional fields: className query
router.get(
  "/",
  validateQuery({ className: { type: "string" } }),
  getCharacters,
  withMessage("Characters retrieved."),
  sendResponse
);

// Get all adventure logs for one character.
// Required fields: characterId parameter
router.get(
  "/:characterId/adventure-logs",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  getAdventureLogsByCharacterId,
  withMessage("Character adventure logs retrieved."),
  sendResponse
);

// Get all unlocked abilities for one character.
// Required fields: characterId parameter
router.get(
  "/:characterId/abilities",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  getCharacterAbilities,
  withMessage("Character abilities retrieved."),
  sendResponse
);

// Get one character by id.
// Required fields: id parameter
router.get(
  "/:id",
  validateParams({ id: { type: "integer", min: 1, localName: "characterId" } }),
  getCharacterById,
  withMessage("Character retrieved."),
  sendResponse
);

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

// Create one character for an existing user.
// Required fields: userId, characterName, origin, className, affinity
router.post(
  "/",
  validateBody({
    userId: { type: "integer", min: 1 },
    characterName: { type: "string" },
    origin: { type: "string" },
    className: { type: "string" },
    affinity: { type: "string" }
  }),
  postCharacter,
  withMessage("Character created.", 201),
  sendResponse
);

// Unlock one ability for a character.
// Required fields: characterId parameter, abilityId
router.post(
  "/:characterId/unlock-ability",
  validateParams({ characterId: { type: "integer", min: 1 } }),
  validateBody({ abilityId: { type: "string" } }),
  unlockCharacterAbility,
  withMessage("Character ability unlocked.", 201),
  sendResponse
);

// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

// Update one character by id.
// Required fields: id parameter, one update field
// Optional fields: characterName, origin, className, affinity
router.put(
  "/:id",
  validateParams({ id: { type: "integer", min: 1, localName: "characterId" } }),
  validateAnyBody({
    characterName: { type: "string" },
    origin: { type: "string" },
    className: { type: "string" },
    affinity: { type: "string" }
  }),
  putCharacterById,
  withMessage("Character updated."),
  sendResponse
);

// ------------------------------------------------------------
// DELETE
// ------------------------------------------------------------

// Delete one character by id.
// Required fields: id parameter
router.delete(
  "/:id",
  validateParams({ id: { type: "integer", min: 1, localName: "characterId" } }),
  deleteCharacter,
  withMessage("Character deleted.", 204),
  sendResponse
);

export default router;
