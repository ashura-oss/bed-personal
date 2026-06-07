import { Router } from "express";
import {
  getCharacterProgression,
  putCharacterProgression,
  putCharacterQuestCompletion
} from "../controllers/progressionController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/characters/:characterId", authenticateToken, getCharacterProgression);
router.put("/characters/:characterId", authenticateToken, putCharacterProgression);
router.put(
  "/characters/:characterId/quest-completions/:questId",
  authenticateToken,
  putCharacterQuestCompletion
);

export default router;
