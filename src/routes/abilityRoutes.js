// Ability route definitions.
import { Router } from "express";
import { getAbilities } from "../controllers/abilityController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all ability definitions.
//Required fields: none
//Optional fields: className query, affinity query
router.get(
  "/",
  getAbilities,
  withMessage("Abilities retrieved."),
  sendResponse
);

export default router;
