import { Router } from "express";
import { getFactionById, getFactions } from "../controllers/factionController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List all faction definitions.
router.get(
  "/",
  getFactions,
  withMessage("Factions retrieved."),
  sendResponse
);

// Read one faction definition.
router.get(
  "/:factionId",
  getFactionById,
  withMessage("Faction retrieved."),
  sendResponse
);

export default router;
