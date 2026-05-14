import { Router } from "express";
import {
  deleteQuest,
  getQuestById,
  getQuests,
  postQuest,
  putQuestById
} from "../controllers/questController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", getQuests);
router.post("/", authenticateToken, postQuest);
router.get("/:id", getQuestById);
router.put("/:id", authenticateToken, putQuestById);
router.delete("/:id", authenticateToken, deleteQuest);

export default router;
