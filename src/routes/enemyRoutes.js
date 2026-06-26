// Enemy route definitions.
import { Router } from "express";
import { getEnemies, getEnemyById } from "../controllers/enemyController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List all enemy definitions.
router.get(
  "/",
  getEnemies,
  withMessage("Enemies retrieved."),
  sendResponse
);

// Read one enemy definition.
router.get(
  "/:enemyId",
  getEnemyById,
  withMessage("Enemy retrieved."),
  sendResponse
);

export default router;
