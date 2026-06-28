// Faction route definitions.
// Route order: validate input, run controller logic, attach success response, then send.
import { Router } from "express";
import { getFactionById, getFactions } from "../controllers/factionController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateParams } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all faction definitions.
// Required fields: none
router.get(
  "/",
  getFactions,
  withMessage("Factions retrieved."),
  sendResponse
);

// Get one faction definition.
// Required fields: factionId parameter
router.get(
  "/:factionId",
  validateParams({ factionId: { type: "string" } }),
  getFactionById,
  withMessage("Faction retrieved."),
  sendResponse
);

export default router;
