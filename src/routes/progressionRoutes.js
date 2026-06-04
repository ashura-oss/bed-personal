import { Router } from "express";
import {
  getCharacterProgression,
  putCharacterProgression
} from "../controllers/progressionController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/characters/:characterId", authenticateToken, getCharacterProgression);
router.put("/characters/:characterId", authenticateToken, putCharacterProgression);

export default router;
