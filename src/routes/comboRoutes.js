import { Router } from "express";
import { postResolveCombo } from "../controllers/comboController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { sendResponse, withMessage } from "../middlewares/response.js";

const router = Router();

router.post(
  "/resolve",
  authenticateToken,
  postResolveCombo,
  withMessage("Combo resolved."),
  sendResponse
);

export default router;
