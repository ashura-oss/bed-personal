import { Router } from "express";
import { deleteCharacter, getCharacterById, getCharacters, postCharacter, putCharacterById } from "../controllers/characterController.js";
import { getCharacterAbilities, unlockCharacterAbility } from "../controllers/abilityController.js";
import { getAdventureLogsByCharacterId } from "../controllers/adventureController.js";
import { loadCharacterFromCharacterIdParam, loadCharacterFromIdParam, loadUserFromBody } from "../middlewares/resourceMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getCharacters, withMessage("Characters retrieved."), sendResponse);

router.post("/", loadUserFromBody, postCharacter, withMessage("Character created.", 201), sendResponse);

router.get("/:characterId/adventure-logs", loadCharacterFromCharacterIdParam, getAdventureLogsByCharacterId, withMessage("Character adventure logs retrieved."), sendResponse);

router.get("/:characterId/abilities", loadCharacterFromCharacterIdParam, getCharacterAbilities, withMessage("Character abilities retrieved."), sendResponse);

router.post("/:characterId/unlock-ability", loadCharacterFromCharacterIdParam, unlockCharacterAbility, withMessage("Character ability unlocked.", 201), sendResponse);

router.get("/:id", loadCharacterFromIdParam, getCharacterById, withMessage("Character retrieved."), sendResponse);

router.put("/:id", loadCharacterFromIdParam, putCharacterById, withMessage("Character updated."), sendResponse);

router.delete("/:id", loadCharacterFromIdParam, deleteCharacter, withMessage("Character deleted.", 204), sendResponse);

export default router;
