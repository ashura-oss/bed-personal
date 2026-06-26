import { Router } from "express";
import { getEnemies, getEnemyById } from "../controllers/enemyController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

router.get("/", getEnemies, withMessage("Enemies retrieved."), sendResponse);

router.get("/:enemyId", getEnemyById, withMessage("Enemy retrieved."), sendResponse);

export default router;
