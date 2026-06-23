import { Router } from "express";
import {
  getCharacterProgression,
  putCharacterProgression,
  putCharacterQuestCompletion
} from "../controllers/progressionController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get(
  "/characters/:characterId",
  authenticateToken,
  getCharacterProgression,
  withMessage("Character progression retrieved."),
  sendResponse
);
router.put(
  "/characters/:characterId",
  authenticateToken,
  putCharacterProgression,
  withMessage("Character progression saved."),
  sendResponse
);
router.put(
  "/characters/:characterId/quest-completions/:questId",
  authenticateToken,
  putCharacterQuestCompletion,
  withMessage("Quest completion claimed."),
  sendResponse
);

export default router;
