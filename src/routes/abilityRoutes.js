// Ability route definitions.
// Route order: optional query input goes straight to the controller for filtering.
import { Router } from "express";
import { getAbilities } from "../controllers/abilityController.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all ability definitions.
// Required fields: none
// Optional fields: className query, affinity query
router.get(
  "/",
  getAbilities
);

export default router;
