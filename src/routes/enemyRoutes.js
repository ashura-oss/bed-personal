// Enemy route definitions.
// Route order: validate filters, run controller logic, attach success response, then send.
import { Router } from "express";
import { getEnemies, getEnemyById } from "../controllers/enemyController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateParams, validateQuery } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all enemy definitions.
// Optional fields: regionId query, isBoss query
router.get(
  "/",
  validateQuery({
    regionId: { type: "string" },
    isBoss: { type: "bit" }
  }),
  getEnemies,
  withMessage("Enemies retrieved."),
  sendResponse
);

// Get one enemy definition.
// Required fields: enemyId parameter
router.get(
  "/:enemyId",
  validateParams({ enemyId: { type: "string" } }),
  getEnemyById,
  withMessage("Enemy retrieved."),
  sendResponse
);

export default router;
