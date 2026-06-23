import { Router } from "express";
import {
  deleteQuest,
  getQuestById,
  getQuests,
  postQuest,
  putQuestById
} from "../controllers/questController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.get("/", getQuests, withMessage("Quests retrieved."), sendResponse);
router.post("/", authenticateToken, postQuest, withMessage("Quest created.", 201), sendResponse);
router.get("/:id", getQuestById, withMessage("Quest retrieved."), sendResponse);
router.put("/:id", authenticateToken, putQuestById, withMessage("Quest updated."), sendResponse);
router.delete("/:id", authenticateToken, deleteQuest, withMessage("Quest deleted."), sendResponse);

export default router;
