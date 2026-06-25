import { Router } from "express";
import { getCharacterProgression, putCharacterProgression, putCharacterQuestCompletion } from "../controllers/progressionController.js";
import { loadCharacterFromCharacterIdParam } from "../middlewares/resourceMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/characters/:characterId", loadCharacterFromCharacterIdParam, getCharacterProgression, withMessage("Character progression retrieved."), sendResponse);

router.put("/characters/:characterId", loadCharacterFromCharacterIdParam, putCharacterProgression, withMessage("Character progression saved."), sendResponse);

router.put("/characters/:characterId/quest-completions/:questId", loadCharacterFromCharacterIdParam, putCharacterQuestCompletion, withMessage("Quest completion claimed."), sendResponse);

export default router;
