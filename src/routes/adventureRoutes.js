import { Router } from "express";
import { postAdventureAttempt } from "../controllers/adventureController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/attempt", authenticateToken, postAdventureAttempt);

export default router;
