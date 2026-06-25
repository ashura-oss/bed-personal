import { Router } from "express";
import { getRegionById, getRegions } from "../controllers/regionController.js";
import { getQuestsByRegionId } from "../controllers/questController.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getRegions, withMessage("Regions retrieved."), sendResponse);

router.get("/:regionId/quests", getQuestsByRegionId, withMessage("Region quests retrieved."), sendResponse);

router.get("/:id", getRegionById, withMessage("Region retrieved."), sendResponse);

export default router;
