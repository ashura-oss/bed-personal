import { Router } from "express";
import { getQuestById, getQuests } from "../controllers/questController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

router.get("/", getQuests, withMessage("Quests retrieved."), sendResponse);

router.get("/:id", getQuestById, withMessage("Quest retrieved."), sendResponse);

export default router;
