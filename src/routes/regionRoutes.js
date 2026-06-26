// Region route definitions.
import { Router } from "express";
import { getQuestsByRegionId } from "../controllers/questController.js";
import { getRegionById, getRegions } from "../controllers/regionController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";
import { requireParamFields } from "../middlewares/validation.js";

const router = Router();

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

//Get all region definitions.
//Required fields: none
//Optional fields: dangerLevel query
router.get(
  "/",
  getRegions,
  withMessage("Regions retrieved."),
  sendResponse
);

//Get all quests inside one region.
//Required fields: regionId parameter
//Optional fields: none
router.get(
  "/:regionId/quests",
  requireParamFields("regionId"),
  getQuestsByRegionId,
  withMessage("Region quests retrieved."),
  sendResponse
);

//Get one region definition.
//Required fields: id parameter
//Optional fields: none
router.get(
  "/:id",
  requireParamFields("id"),
  getRegionById,
  withMessage("Region retrieved."),
  sendResponse
);

export default router;
