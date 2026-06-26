// Region route definitions.
import { Router } from "express";
import { getRegionById, getRegions } from "../controllers/regionController.js";
import { getQuestsByRegionId } from "../controllers/questController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List all region definitions.
router.get(
  "/",
  getRegions,
  withMessage("Regions retrieved."),
  sendResponse
);

// List quests inside one region.
router.get(
  "/:regionId/quests",
  getQuestsByRegionId,
  withMessage("Region quests retrieved."),
  sendResponse
);

// Read one region definition.
router.get(
  "/:id",
  getRegionById,
  withMessage("Region retrieved."),
  sendResponse
);

export default router;
