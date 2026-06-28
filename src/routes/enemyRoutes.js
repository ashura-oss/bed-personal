// Enemy route definitions.
// Route order: optional query input goes straight to the controller for filtering fixed enemy data.
import { Router } from "express";
import { getEnemies, getEnemyById } from "../controllers/enemyController.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all enemy definitions.
// Required fields: none
// Optional fields: regionId query, isBoss query
router.get(
  "/",
  getEnemies
);

// Get one enemy definition.
// Required fields: enemyId parameter
// Optional fields: none
router.get(
  "/:enemyId",
  requireParamFields("enemyId"),
  getEnemyById
);

export default router;
