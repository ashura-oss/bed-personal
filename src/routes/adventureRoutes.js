import { Router } from "express";
import { postAdventureAttempt } from "../controllers/adventureController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.post(
  "/attempt",
  authenticateToken,
  postAdventureAttempt,
  withMessage("Adventure attempt resolved."),
  sendResponse
);

export default router;
