// Enemy route definitions.
import { Router } from "express";
import { getEnemies, getEnemyById } from "../controllers/enemyController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all enemy definitions.
//Required fields: none
//Optional fields: regionId query, isBoss query
router.get(
  "/",
  getEnemies,
  withMessage("Enemies retrieved."),
  sendResponse
);

//Get one enemy definition.
//Required fields: enemyId parameter
//Optional fields: none
router.get(
  "/:enemyId",
  requireParamFields("enemyId"),
  getEnemyById,
  withMessage("Enemy retrieved."),
  sendResponse
);

export default router;
