// Quest route definitions.
import { Router } from "express";
import { getQuestById, getQuests } from "../controllers/questController.js";
import { sendResponse, withMessage } from "../middlewares/statusMessage.js";

const router = Router();

// List all quest definitions.
router.get(
  "/",
  getQuests,
  withMessage("Quests retrieved."),
  sendResponse
);

// Read one quest definition.
router.get(
  "/:id",
  getQuestById,
  withMessage("Quest retrieved."),
  sendResponse
);

export default router;
