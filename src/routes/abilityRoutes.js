// Ability route definitions.
import { Router } from "express";
import { getAbilities } from "../controllers/abilityController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List all ability definitions.
router.get(
  "/",
  getAbilities,
  withMessage("Abilities retrieved."),
  sendResponse
);

export default router;
