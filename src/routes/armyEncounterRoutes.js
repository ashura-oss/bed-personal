import { Router } from "express";
import { getArmyEncounterById, getArmyEncounters } from "../controllers/armyEncounterController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List all army encounter definitions.
router.get(
  "/",
  getArmyEncounters,
  withMessage("Army encounters retrieved."),
  sendResponse
);

// Read one army encounter definition.
router.get(
  "/:armyEncounterId",
  getArmyEncounterById,
  withMessage("Army encounter retrieved."),
  sendResponse
);

export default router;
