// Region route definitions.
// Route order: validate required params when needed, then let the controller return fixed region data.
import { Router } from "express";
import { getQuestsByRegionId } from "../controllers/questController.js";
import { getRegionById, getRegions } from "../controllers/regionController.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all region definitions.
// Required fields: none
// Optional fields: dangerLevel query
router.get(
  "/",
  getRegions
);

// Get all quests inside one region.
// Required fields: regionId parameter
// Optional fields: none
router.get(
  "/:regionId/quests",
  requireParamFields("regionId"),
  getQuestsByRegionId
);

// Get one region definition.
// Required fields: id parameter
// Optional fields: none
router.get(
  "/:id",
  requireParamFields("id"),
  getRegionById
);

export default router;
