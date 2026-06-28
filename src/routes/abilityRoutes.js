// Ability route definitions.
// Route order: validate filters, run controller logic, attach success response, then send.
import { Router } from "express";
import { getAbilities } from "../controllers/abilityController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateQuery } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all ability definitions.
// Optional fields: className query, affinity query
router.get(
  "/",
  validateQuery({
    className: { type: "string" },
    affinity: { type: "string" }
  }),
  getAbilities,
  withMessage("Abilities retrieved."),
  sendResponse
);

export default router;
