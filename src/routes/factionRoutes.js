// Faction route definitions.
// Route order: validate required params when needed, then let the controller return fixed faction data.
import { Router } from "express";
import { getFactionById, getFactions } from "../controllers/factionController.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all faction definitions.
// Required fields: none
// Optional fields: none
router.get(
  "/",
  getFactions
);

// Get one faction definition.
// Required fields: factionId parameter
// Optional fields: none
router.get(
  "/:factionId",
  requireParamFields("factionId"),
  getFactionById
);

export default router;
