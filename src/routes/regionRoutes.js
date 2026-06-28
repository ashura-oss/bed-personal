// Region route definitions.
// Region data is fixed game content, while per-character region state is saved elsewhere.
import { Router } from "express";
import { getQuestsByRegionId } from "../controllers/questController.js";
import { getRegionById, getRegions } from "../controllers/regionController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";
import { validateParams, validateQuery } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

// Get all region definitions.
// Optional fields: dangerLevel query
router.get(
  "/",
  validateQuery({ dangerLevel: { type: "integer", min: 1 } }),
  getRegions,
  withMessage("Regions retrieved."),
  sendResponse
);

// Get all quests inside one region.
// Required fields: regionId parameter
router.get(
  "/:regionId/quests",
  validateParams({ regionId: { type: "string" } }),
  getQuestsByRegionId,
  withMessage("Region quests retrieved."),
  sendResponse
);

// Get one region definition.
// Required fields: id parameter
router.get(
  "/:id",
  validateParams({ id: { type: "string" } }),
  getRegionById,
  withMessage("Region retrieved."),
  sendResponse
);

export default router;
