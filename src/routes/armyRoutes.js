import { Router } from "express";
import { getCharacterArmyState, postCharacterArmyBattle, putCharacterArmyState } from "../controllers/armyController.js";
import { loadCharacterFromCharacterIdParam } from "../middlewares/resourceMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/characters/:characterId", loadCharacterFromCharacterIdParam, getCharacterArmyState, withMessage("Character army state retrieved."), sendResponse);

router.put("/characters/:characterId", loadCharacterFromCharacterIdParam, putCharacterArmyState, withMessage("Character army state saved."), sendResponse);

router.post("/characters/:characterId/battles", loadCharacterFromCharacterIdParam, postCharacterArmyBattle, withMessage("Army battle resolved."), sendResponse);

export default router;
