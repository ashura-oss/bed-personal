import { Router } from "express";
import { getRegionById, getRegions } from "../controllers/regionController.js";
import { getQuestsByRegionId } from "../controllers/questController.js";

const router = Router();

router.get("/", getRegions);
router.get("/:regionId/quests", getQuestsByRegionId);
router.get("/:id", getRegionById);

export default router;
