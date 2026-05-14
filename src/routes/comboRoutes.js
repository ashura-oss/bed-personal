import { Router } from "express";
import { postResolveCombo } from "../controllers/comboController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/resolve", authenticateToken, postResolveCombo);

export default router;
